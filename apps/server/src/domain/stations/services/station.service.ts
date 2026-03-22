import { Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { env } from "@/config/env";

import type {
  StationCapacityLimitExceeded,
  StationCapacitySplitInvalid,
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
} from "../errors";
import type {
  CreateStationInput,
  NearestSearchArgs,
  NearestStationRow,
  StationFilter,
  StationRow,
  StationSortField,
  UpdateStationInput,
} from "../models";
import type { StationRepo } from "../repository/station.repository";

import {
  StationCapacityLimitExceeded as StationCapacityLimitExceededError,
  StationCapacitySplitInvalid as StationCapacitySplitInvalidError,
  StationNotFound,
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
  >;
  listStations: (
    filter: StationFilter,
    pageReq: PageRequest<StationSortField>,
  ) => Effect.Effect<PageResult<StationRow>>;

  getStationById: (id: string) => Effect.Effect<StationRow, StationNotFound>;

  listNearestStations: (
    args: NearestSearchArgs,
  ) => Effect.Effect<PageResult<NearestStationRow>>;
};

function makeStationService(repo: StationRepo): StationService {
  function resolveCapacitySplit(input: {
    capacity: number;
    pickupSlotLimit?: number;
    returnSlotLimit?: number;
  }) {
    return {
      totalCapacity: input.capacity,
      pickupSlotLimit: input.pickupSlotLimit ?? input.capacity,
      returnSlotLimit: input.returnSlotLimit ?? input.capacity,
    };
  }

  function validateCapacitySplit(args: {
    totalCapacity: number;
    pickupSlotLimit: number;
    returnSlotLimit: number;
  }) {
    return args.totalCapacity > 0
      && args.pickupSlotLimit >= 0
      && args.returnSlotLimit >= 0
      && args.pickupSlotLimit + args.returnSlotLimit <= args.totalCapacity;
  }

  return {
    createStation: input =>
      Effect.gen(function* () {
        if (input.capacity > env.STATION_CAPACITY_LIMIT) {
          return yield* Effect.fail(new StationCapacityLimitExceededError({
            capacity: input.capacity,
            maxCapacity: env.STATION_CAPACITY_LIMIT,
          }));
        }

        const split = resolveCapacitySplit(input);
        if (!validateCapacitySplit(split)) {
          return yield* Effect.fail(new StationCapacitySplitInvalidError(split));
        }

        return yield* repo.create(input).pipe(
          Effect.catchTag("StationRepositoryError", err => Effect.die(err)),
        );
      }),
    updateStation: (id, input) =>
      Effect.gen(function* () {
        const currentOpt = yield* repo.getById(id).pipe(
          Effect.catchTag("StationRepositoryError", err => Effect.die(err)),
        );
        if (Option.isNone(currentOpt)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }

        const current = currentOpt.value;
        const nextCapacity = input.capacity ?? current.totalCapacity;
        if (
          nextCapacity > env.STATION_CAPACITY_LIMIT
        ) {
          return yield* Effect.fail(new StationCapacityLimitExceededError({
            capacity: nextCapacity,
            maxCapacity: env.STATION_CAPACITY_LIMIT,
          }));
        }

        const split = {
          totalCapacity: nextCapacity,
          pickupSlotLimit: input.pickupSlotLimit ?? current.pickupSlotLimit,
          returnSlotLimit: input.returnSlotLimit ?? current.returnSlotLimit,
        };
        if (!validateCapacitySplit(split)) {
          return yield* Effect.fail(new StationCapacitySplitInvalidError(split));
        }

        const updatedOpt = yield* repo.update(id, input).pipe(
          Effect.catchTag("StationRepositoryError", err => Effect.die(err)),
        );
        if (Option.isNone(updatedOpt)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }
        return updatedOpt.value;
      }),
    listStations: (filter, page) =>
      repo.listWithOffset(filter, page).pipe(
        Effect.catchTag("StationRepositoryError", err => Effect.die(err)),
      ),
    getStationById: id =>
      Effect.gen(function* () {
        const maybe = yield* repo
          .getById(id)
          .pipe(
            Effect.catchTag("StationRepositoryError", err => Effect.die(err)),
          );
        if (Option.isNone(maybe)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }
        return maybe.value;
      }),
    listNearestStations: args =>
      repo.listNearest(args).pipe(
        Effect.catchTag("StationRepositoryError", err => Effect.die(err)),
      ),
  };
}

const makeStationServiceEffect = Effect.gen(function* () {
  const repo = yield* StationRepository;
  return makeStationService(repo);
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
