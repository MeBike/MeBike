import type { Effect, Option } from "effect";

import type { PageResult } from "@/domain/shared/pagination";

import type {
  RatingAlreadyExists,
  RatingRepositoryError,
} from "../domain-errors";
import type {
  AdminRatingDetailRow,
  AdminRatingFilters,
  AdminRatingListItemRow,
  AdminRatingPageRequest,
  CreateRatingInput,
  RatingAggregate,
  RatingRow,
  RatingSummary,
} from "../models";

export type RatingRepo = {
  readonly createRating: (
    input: CreateRatingInput,
  ) => Effect.Effect<RatingRow, RatingRepositoryError | RatingAlreadyExists>;
  readonly findByRentalId: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<RatingRow>, RatingRepositoryError>;
  readonly findAdminList: (
    filters: AdminRatingFilters,
    pageReq: AdminRatingPageRequest,
  ) => Effect.Effect<PageResult<AdminRatingListItemRow>, RatingRepositoryError>;
  readonly findAdminDetailById: (
    ratingId: string,
  ) => Effect.Effect<Option.Option<AdminRatingDetailRow>, RatingRepositoryError>;
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
