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
 * Tao command-side service cho station domain.
 *
 * @param args Tap dependency command/query de build service.
 * @param args.commandRepo Repository command de tao/cap nhat tram.
 * @param args.queryRepo Repository query can de validate state hien tai.
 * @param args.agencyRepo Repository agency de validate ownership.
 * @returns StationCommandService da bao gom business rule truoc khi ghi du lieu.
 */
export function makeStationCommandService(args: {
  commandRepo: StationCommandRepo;
  queryRepo: Pick<StationQueryRepo, "getByAgencyId" | "getById">;
  agencyRepo: Pick<AgencyRepo, "getById">;
}): StationCommandService {
  const { agencyRepo, commandRepo, queryRepo } = args;

  /**
   * Chuan hoa capacity split khi tao tram moi.
   *
   * @param input Input tao tram chua chac da co returnSlotLimit.
   * @param input.totalCapacity Tong suc chua cua tram moi.
   * @param input.returnSlotLimit Gioi han slot tra xe neu caller co truyen vao.
   * @returns Cap total/return slot da duoc fill default.
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
   * Chuan hoa capacity split khi cap nhat de giu hanh vi default on dinh.
   *
   * @param current Tram hien tai trong DB.
   * @param input Payload cap nhat.
   * @returns Cap total/return slot sau khi merge voi gia tri cu.
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
   * Validate return slot limit co nam trong khoang hop le cua total capacity hay khong.
   *
   * @param args Cap total/return slot can kiem tra.
   * @param args.totalCapacity Tong suc chua can doi chieu.
   * @param args.returnSlotLimit Gioi han slot tra xe can validate.
   * @returns `true` neu split hop le.
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
   * Validate quan he giua station type va agency ownership.
   *
   * @param args Loai tram, agency va station dang bi exclude khi update.
   * @param args.stationType Loai tram sau khi merge input.
   * @param args.agencyId Agency duoc gan cho tram.
   * @param args.excludeStationId Station can bo qua khi dang update chinh no.
   * @returns Effect chi thanh cong khi ownership hop le va agency ton tai.
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
   * Chan cac cap nhat lam vi pham tai nguyen dang duoc su dung.
   *
   * @param current Trang thai tram hien tai.
   * @param next Gia tri suc chua moi sau khi merge update.
   * @param next.totalCapacity Tong suc chua sau cap nhat.
   * @param next.returnSlotLimit Gioi han slot tra xe sau cap nhat.
   * @returns Effect fail neu cap nhat lam vuot qua bike/return-slot dang active.
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
