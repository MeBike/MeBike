import { Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { env } from "@/config/env";

import type {
  StationCapacityLimitExceeded,
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

import { StationCapacityLimitExceeded as StationCapacityLimitExceededError, StationNotFound } from "../errors";
import { StationRepository } from "../repository/station.repository";

export type StationService = {
  createStation: (
    input: CreateStationInput,
  ) => Effect.Effect<
    StationRow,
    StationNameAlreadyExists | StationOutsideSupportedArea | StationCapacityLimitExceeded
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
  return {
    createStation: input =>
      Effect.gen(function* () {
        if (input.capacity > env.STATION_CAPACITY_LIMIT) {
          return yield* Effect.fail(new StationCapacityLimitExceededError({
            capacity: input.capacity,
            maxCapacity: env.STATION_CAPACITY_LIMIT,
          }));
        }
        return yield* repo.create(input).pipe(
          Effect.catchTag("StationRepositoryError", err => Effect.die(err)),
        );
      }),
    updateStation: (id, input) =>
      Effect.gen(function* () {
        if (
          input.capacity != null
          && input.capacity > env.STATION_CAPACITY_LIMIT
        ) {
          return yield* Effect.fail(new StationCapacityLimitExceededError({
            capacity: input.capacity,
            maxCapacity: env.STATION_CAPACITY_LIMIT,
          }));
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
