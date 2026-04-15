import { Effect, Layer, Option } from "effect";

import type { AgencyRepo } from "@/domain/agencies";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { env } from "@/config/env";
import { AgencyRepository, AgencyRepositoryError } from "@/domain/agencies";
import { defectOn } from "@/domain/shared";

import type {
  StationAgencyAlreadyAssigned,
  StationAgencyForbidden,
  StationAgencyNotFound,
  StationAgencyRequired,
  StationCapacityBelowActiveUsage,
  StationCapacityLimitExceeded,
  StationCapacitySplitInvalid,
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
  StationReturnSlotLimitBelowActiveReservations,
} from "../errors";
import type {
  CreateStationInput,
  NearestSearchArgs,
  NearestStationRow,
  StationFilter,
  StationRevenueStats,
  StationRow,
  StationSortField,
  UpdateStationInput,
} from "../models";
import type { StationRepo } from "../repository/station.repository";

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
import { StationRepository } from "../repository/station.repository";

export type StationService = {
  createStation: (
    input: CreateStationInput,
  ) => Effect.Effect<
    StationRow,
    | StationNameAlreadyExists
    | StationOutsideSupportedArea
    | StationCapacityLimitExceeded
    | StationCapacitySplitInvalid
    | StationAgencyRequired
    | StationAgencyForbidden
    | StationAgencyNotFound
    | StationAgencyAlreadyAssigned
  >;
  updateStation: (
    id: string,
    input: UpdateStationInput,
  ) => Effect.Effect<
    StationRow,
    | StationNotFound
    | StationNameAlreadyExists
    | StationOutsideSupportedArea
    | StationCapacityLimitExceeded
    | StationCapacitySplitInvalid
    | StationCapacityBelowActiveUsage
    | StationReturnSlotLimitBelowActiveReservations
    | StationAgencyRequired
    | StationAgencyForbidden
    | StationAgencyNotFound
    | StationAgencyAlreadyAssigned
  >;
  listStations: (
    filter: StationFilter,
    pageReq: PageRequest<StationSortField>,
  ) => Effect.Effect<PageResult<StationRow>>;

  getStationById: (id: string) => Effect.Effect<StationRow, StationNotFound>;

  listNearestStations: (
    args: NearestSearchArgs,
  ) => Effect.Effect<PageResult<NearestStationRow>>;
  getRevenueByStation: (args: {
    from: Date;
    to: Date;
  }) => Effect.Effect<StationRevenueStats>;
};

export function makeStationService(repo: StationRepo, deps: {
  agencyRepo: Pick<AgencyRepo, "getById">;
  reservationRepo?: unknown;
}): StationService {
  function resolveCapacitySplit(input: {
    totalCapacity: number;
    returnSlotLimit?: number;
  }) {
    return {
      totalCapacity: input.totalCapacity,
      returnSlotLimit: input.returnSlotLimit ?? input.totalCapacity,
    };
  }

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

  function validateCapacitySplit(args: {
    totalCapacity: number;
    returnSlotLimit: number;
  }) {
    return args.totalCapacity > 0
      && args.returnSlotLimit >= 0
      && args.returnSlotLimit <= args.totalCapacity;
  }

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

      const agency = yield* deps.agencyRepo.getById(agencyId).pipe(
        defectOn(AgencyRepositoryError),
      );

      if (Option.isNone(agency)) {
        return yield* Effect.fail(new StationAgencyNotFoundError({
          agencyId,
        }));
      }

      const existingStation = yield* repo.getByAgencyId(agencyId);
      if (
        Option.isSome(existingStation)
        && existingStation.value.id !== args.excludeStationId
      ) {
        return yield* Effect.fail(new StationAgencyAlreadyAssignedError({
          agencyId,
          stationId: existingStation.value.id,
        }));
      }
    });

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

        return yield* repo.create(input);
      }),
    updateStation: (id, input) =>
      Effect.gen(function* () {
        const currentOpt = yield* repo.getById(id);
        if (Option.isNone(currentOpt)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }

        const current = currentOpt.value;
        const nextCapacity = input.totalCapacity ?? current.totalCapacity;
        if (
          nextCapacity > env.STATION_CAPACITY_LIMIT
        ) {
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

        const updatedOpt = yield* repo.update(id, input);
        if (Option.isNone(updatedOpt)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }
        return updatedOpt.value;
      }),
    listStations: (filter, page) =>
      repo.listWithOffset(filter, page),
    getStationById: id =>
      Effect.gen(function* () {
        const maybe = yield* repo.getById(id);
        if (Option.isNone(maybe)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }
        return maybe.value;
      }),
    listNearestStations: args =>
      repo.listNearest(args),
    getRevenueByStation: args =>
      Effect.gen(function* () {
        const rows = yield* repo.getRevenueByStation(args);
        const stations = [...rows].sort((a, b) => b.totalRevenue - a.totalRevenue);
        const totalRevenue = stations.reduce((sum, station) => sum + station.totalRevenue, 0);
        const totalRentals = stations.reduce((sum, station) => sum + station.totalRentals, 0);

        return {
          period: args,
          summary: {
            totalStations: stations.length,
            totalRevenue,
            totalRentals,
            avgRevenuePerStation: stations.length === 0
              ? 0
              : Number((totalRevenue / stations.length).toFixed(2)),
          },
          stations,
        } satisfies StationRevenueStats;
      }),
  };
}

const makeStationServiceEffect = Effect.gen(function* () {
  const repo = yield* StationRepository;
  const agencyRepo = yield* AgencyRepository;
  return makeStationService(repo, { agencyRepo });
});

export class StationServiceTag extends Effect.Service<StationServiceTag>()(
  "StationService",
  {
    effect: makeStationServiceEffect,
  },
) {}

export const StationServiceLive = Layer.effect(
  StationServiceTag,
  makeStationServiceEffect.pipe(Effect.map(StationServiceTag.make)),
);
