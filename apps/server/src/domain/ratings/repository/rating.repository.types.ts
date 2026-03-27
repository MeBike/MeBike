import type { Effect, Option } from "effect";

import type {
  CreateRatingInput,
  RatingAggregate,
  RatingRow,
  RatingSummary,
} from "../models";

import type {
  RatingAlreadyExists,
  RatingRepositoryError,
} from "../domain-errors";

export type RatingRepo = {
  readonly createRating: (
    input: CreateRatingInput,
  ) => Effect.Effect<RatingRow, RatingRepositoryError | RatingAlreadyExists>;
  readonly findByRentalId: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<RatingRow>, RatingRepositoryError>;
  readonly findBikeSummary: (
    bikeId: string,
  ) => Effect.Effect<RatingSummary, RatingRepositoryError>;
  readonly findBikeAggregates: (
    bikeIds: readonly string[],
  ) => Effect.Effect<Record<string, RatingAggregate>, RatingRepositoryError>;
  readonly findStationSummary: (
    stationId: string,
  ) => Effect.Effect<RatingSummary, RatingRepositoryError>;
};
