import { Context, Effect, Layer, Option } from "effect";

import type { BikeNotFound } from "@/domain/bikes";
import type { PageResult } from "@/domain/shared/pagination";
import type { StationNotFound } from "@/domain/stations";

import { BikeNotFound as BikeNotFoundError, BikeRepository } from "@/domain/bikes";
import { StationNotFound as StationNotFoundError, StationQueryRepository } from "@/domain/stations";

import type { RatingAlreadyExists, RatingRepositoryError } from "../domain-errors";
import type {
  AdminRatingDetailRow,
  AdminRatingFilters,
  AdminRatingListItemRow,
  AdminRatingPageRequest,
  CreateRatingInput,
  RatingReasonRow,
  RatingRow,
  RatingSummary,
} from "../models";

import { RatingReasonRepository } from "../repository/rating-reason.repository";
import { RatingRepository } from "../repository/rating.repository";

export type RatingService = {
  create: (
    input: CreateRatingInput,
  ) => Effect.Effect<
    RatingRow,
    RatingRepositoryError | RatingAlreadyExists
  >;
  getByRentalId: (
    rentalId: string,
  ) => Effect.Effect<
    Option.Option<RatingRow>,
    RatingRepositoryError
  >;
  getReasons: (
    filters?: {
      readonly type?: RatingReasonRow["type"];
      readonly appliesTo?: RatingReasonRow["appliesTo"];
    },
  ) => Effect.Effect<readonly RatingReasonRow[]>;
  listForAdmin: (
    filters: AdminRatingFilters,
    pageReq: AdminRatingPageRequest,
  ) => Effect.Effect<PageResult<AdminRatingListItemRow>, RatingRepositoryError>;
  getAdminDetailById: (
    ratingId: string,
  ) => Effect.Effect<Option.Option<AdminRatingDetailRow>, RatingRepositoryError>;
  getBikeSummary: (
    bikeId: string,
  ) => Effect.Effect<
    RatingSummary,
    RatingRepositoryError | BikeNotFound
  >;
  getStationSummary: (
    stationId: string,
  ) => Effect.Effect<
    RatingSummary,
    RatingRepositoryError | StationNotFound
  >;
};

export class RatingServiceTag extends Context.Tag("RatingService")<
  RatingServiceTag,
  RatingService
>() {}

export const RatingServiceLive = Layer.effect(
  RatingServiceTag,
  Effect.gen(function* () {
    const repo = yield* RatingRepository;
    const reasonRepo = yield* RatingReasonRepository;
    const bikeRepo = yield* BikeRepository;
    const stationRepo = yield* StationQueryRepository;

    const service: RatingService = {
      create: input =>
        repo.createRating(input),

      getByRentalId: rentalId =>
        repo.findByRentalId(rentalId),

      getReasons: filters =>
        reasonRepo.findMany(filters).pipe(Effect.orDie),

      listForAdmin: (filters, pageReq) =>
        repo.findAdminList(filters, pageReq),

      getAdminDetailById: ratingId =>
        repo.findAdminDetailById(ratingId),

      getBikeSummary: bikeId =>
        Effect.gen(function* () {
          const bike = yield* bikeRepo.getById(bikeId);
          if (Option.isNone(bike)) {
            return yield* Effect.fail(new BikeNotFoundError({ id: bikeId }));
          }

          return yield* repo.findBikeSummary(bikeId);
        }),

      getStationSummary: stationId =>
        Effect.gen(function* () {
          const station = yield* stationRepo.getById(stationId);
          if (Option.isNone(station)) {
            return yield* Effect.fail(new StationNotFoundError({ id: stationId }));
          }

          return yield* repo.findStationSummary(stationId);
        }),
    };

    return service;
  }),
);
