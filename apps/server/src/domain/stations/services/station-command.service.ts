import { Effect, Option } from "effect";

import type { AgencyRepo } from "@/domain/agencies";

import { env } from "@/config/env";
import { AgencyRepositoryError } from "@/domain/agencies";
import { defectOn } from "@/domain/shared";

import type { CreateStationInput, StationRow, UpdateStationInput } from "../models";
import type {
  StationCommandRepo,
  StationQueryRepo,
} from "../repository/station.repository.types";
import type { StationCommandService } from "./station.service.types";

import {
  StationAgencyAlreadyAssigned as StationAgencyAlreadyAssignedError,
  StationAgencyForbidden as StationAgencyForbiddenError,
  StationAgencyNotFound as StationAgencyNotFoundError,
  StationAgencyRequired as StationAgencyRequiredError,
  StationCapacityBelowActiveUsage as StationCapacityBelowActiveUsageError,
  StationCapacityLimitExceeded as StationCapacityLimitExceededError,
  StationCapacitySplitInvalid as StationCapacitySplitInvalidError,
  StationNotFound,
  StationReturnSlotLimitBelowActiveReservations as StationReturnSlotLimitBelowActiveReservationsError,
} from "../errors";

/**
 * EN: Builds the command-side station service.
 * VI: Xây dựng service command-side cho station domain.
 *
 * EN: Keeps write-side business rules close to station mutations while delegating
 * persistence to command/query repositories.
 * VI: Giữ các business rule phía ghi gần với mutation của station, còn persistence
 * được tách cho command/query repositories.
 */
export function makeStationCommandService(args: {
  commandRepo: StationCommandRepo;
  queryRepo: Pick<StationQueryRepo, "getByAgencyId" | "getById">;
  agencyRepo: Pick<AgencyRepo, "getById">;
}): StationCommandService {
  const { agencyRepo, commandRepo, queryRepo } = args;

  /**
   * EN: Normalizes capacity defaults for station creation.
   * VI: Chuẩn hóa capacity mặc định khi tạo trạm.
   *
   * EN: When caller omits `returnSlotLimit`, we default it to full station capacity.
   * VI: Nếu caller không truyền `returnSlotLimit` thì mặc định bằng toàn bộ sức chứa trạm.
   */
  function resolveCapacitySplit(input: {
    totalCapacity: number;
    returnSlotLimit?: number;
  }) {
    return {
      totalCapacity: input.totalCapacity,
      returnSlotLimit: input.returnSlotLimit ?? input.totalCapacity,
    };
  }

  /**
   * EN: Normalizes capacity values for station updates.
   * VI: Chuẩn hóa capacity khi cập nhật trạm.
   *
   * EN: Preserves the old defaulting behavior when total capacity changes but the
   * stored return-slot limit still mirrors total capacity.
   * VI: Giữ nguyên hành vi default cũ khi total capacity thay đổi nhưng
   * return-slot limit đang bám theo total capacity hiện tại.
   */
  function resolveUpdatedCapacitySplit(current: StationRow, input: UpdateStationInput) {
    const totalCapacity = input.totalCapacity ?? current.totalCapacity;

    const returnSlotLimit = input.returnSlotLimit
      ?? (input.totalCapacity != null && current.returnSlotLimit === current.totalCapacity
        ? input.totalCapacity
        : current.returnSlotLimit);

    return {
      totalCapacity,
      returnSlotLimit,
    };
  }

  /**
   * EN: Validates that the return-slot limit stays within physical capacity bounds.
   * VI: Validate để return-slot limit luôn nằm trong giới hạn sức chứa vật lý.
   *
   * @returns EN: `true` when the split is valid. VI: `true` nếu split hợp lệ.
   */
  function validateCapacitySplit(args: {
    totalCapacity: number;
    returnSlotLimit: number;
  }) {
    return args.totalCapacity > 0
      && args.returnSlotLimit >= 0
      && args.returnSlotLimit <= args.totalCapacity;
  }

  /**
   * EN: Validates the relationship between station type and agency ownership.
   * VI: Validate quan hệ giữa station type và agency ownership.
   *
   * EN: Used by both create and update flows to enforce internal vs agency-backed
   * station rules and prevent an agency from being attached to multiple stations.
   * VI: Dùng cho cả flow create và update để enforce rule internal/agency-backed,
   * đồng thời ngăn một agency bị gán cho nhiều station.
   */
  const validateOwnership = (args: {
    stationType: CreateStationInput["stationType"];
    agencyId: string | null | undefined;
    excludeStationId?: string;
  }) =>
    Effect.gen(function* () {
      const stationType = args.stationType ?? "INTERNAL";
      const agencyId = args.agencyId ?? null;

      if (stationType === "AGENCY" && !agencyId) {
        return yield* Effect.fail(new StationAgencyRequiredError({}));
      }

      if (stationType === "INTERNAL" && agencyId) {
        return yield* Effect.fail(new StationAgencyForbiddenError({}));
      }

      if (!agencyId) {
        return;
      }

      const agency = yield* agencyRepo.getById(agencyId).pipe(
        defectOn(AgencyRepositoryError),
      );

      if (Option.isNone(agency)) {
        return yield* Effect.fail(new StationAgencyNotFoundError({ agencyId }));
      }

      const existingStation = yield* queryRepo.getByAgencyId(agencyId);
      if (Option.isSome(existingStation) && existingStation.value.id !== args.excludeStationId) {
        return yield* Effect.fail(new StationAgencyAlreadyAssignedError({
          agencyId,
          stationId: existingStation.value.id,
        }));
      }
    });

  /**
   * EN: Prevents updates that would invalidate active operational state.
   * VI: Chặn các cập nhật làm vi phạm trạng thái vận hành đang active.
   *
   * EN: Capacity cannot drop below currently occupied physical usage, and return-slot
   * limit cannot drop below already active return reservations.
   * VI: Capacity không được thấp hơn mức sử dụng vật lý hiện tại, và return-slot limit
   * không được thấp hơn số return reservation đang active.
   */
  const validateOperationalUpdate = (current: StationRow, next: {
    totalCapacity: number;
    returnSlotLimit: number;
  }) =>
    Effect.gen(function* () {
      if (
        next.totalCapacity !== current.totalCapacity
        && next.totalCapacity < current.totalBikes + current.activeReturnSlots
      ) {
        return yield* Effect.fail(new StationCapacityBelowActiveUsageError({
          stationId: current.id,
          totalCapacity: next.totalCapacity,
          totalBikes: current.totalBikes,
          activeReturnSlots: current.activeReturnSlots,
        }));
      }

      if (
        next.returnSlotLimit !== current.returnSlotLimit
        && next.returnSlotLimit < current.activeReturnSlots
      ) {
        return yield* Effect.fail(new StationReturnSlotLimitBelowActiveReservationsError({
          stationId: current.id,
          returnSlotLimit: next.returnSlotLimit,
          activeReturnSlots: current.activeReturnSlots,
        }));
      }
    });

  return {
    createStation: input =>
      Effect.gen(function* () {
        if (input.totalCapacity > env.STATION_CAPACITY_LIMIT) {
          return yield* Effect.fail(new StationCapacityLimitExceededError({
            totalCapacity: input.totalCapacity,
            maxCapacity: env.STATION_CAPACITY_LIMIT,
          }));
        }

        const split = resolveCapacitySplit(input);
        if (!validateCapacitySplit(split)) {
          return yield* Effect.fail(new StationCapacitySplitInvalidError(split));
        }

        yield* validateOwnership({
          stationType: input.stationType,
          agencyId: input.agencyId,
        });

        return yield* commandRepo.create(input);
      }),

    updateStation: (id, input) =>
      Effect.gen(function* () {
        const currentOpt = yield* queryRepo.getById(id);
        if (Option.isNone(currentOpt)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }

        const current = currentOpt.value;
        const nextCapacity = input.totalCapacity ?? current.totalCapacity;
        if (nextCapacity > env.STATION_CAPACITY_LIMIT) {
          return yield* Effect.fail(new StationCapacityLimitExceededError({
            totalCapacity: nextCapacity,
            maxCapacity: env.STATION_CAPACITY_LIMIT,
          }));
        }

        const split = resolveUpdatedCapacitySplit(current, input);
        if (!validateCapacitySplit(split)) {
          return yield* Effect.fail(new StationCapacitySplitInvalidError(split));
        }

        yield* validateOperationalUpdate(current, split);

        const nextStationType = input.stationType ?? current.stationType;
        const nextAgencyId = input.agencyId === undefined ? current.agencyId : input.agencyId;

        yield* validateOwnership({
          stationType: nextStationType,
          agencyId: nextAgencyId,
          excludeStationId: current.id,
        });

        const updatedOpt = yield* commandRepo.update(id, input);
        if (Option.isNone(updatedOpt)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }
        return updatedOpt.value;
      }),
  };
}
