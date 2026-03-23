import { BikesContracts } from "@mebike/shared";
import { Effect } from "effect";

import type { BikeRow } from "@/domain/bikes";

import { RatingRepository } from "@/domain/ratings";
import { toBikeSummary } from "@/http/presenters/bikes.presenter";

export type BikesRoutes = typeof import("@mebike/shared")["serverRoutes"]["bikes"];

export type BikeSummary = BikesContracts.BikeSummary;
export type BikeNotFoundResponse = BikesContracts.BikeNotFoundResponse;
export type BikeUpdateConflictResponse = BikesContracts.BikeUpdateConflictResponse;
export type BikeRentalStatsResponse = BikesContracts.BikeRentalStats;
export type BikeStatisticsResponse = BikesContracts.BikeStatistics;
export type BikeStatsResponse = BikesContracts.BikeStats;
export type HighestRevenueBikeResponse = BikesContracts.HighestRevenueBike | null;
export type BikeActivityStatsResponse = BikesContracts.BikeActivityStats;
export type BikeRentalHistoryResponse = {
  data: BikesContracts.BikeRentalHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type BikeListResponse = {
  data: BikeSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export const { BikeErrorCodeSchema, bikeErrorMessages } = BikesContracts;

export function loadBikeSummary(row: BikeRow) {
  return Effect.gen(function* () {
    const ratingRepo = yield* RatingRepository;
    const rating = yield* ratingRepo.findBikeAggregates([row.id]).pipe(
      Effect.catchTag("RatingRepositoryError", err => Effect.die(err)),
      Effect.map(map => map[row.id]),
    );

    return toBikeSummary(row, rating);
  });
}

export function loadBikeSummaries(rows: readonly BikeRow[]) {
  return Effect.gen(function* () {
    const ratingRepo = yield* RatingRepository;
    const ratingsByBikeId = yield* ratingRepo.findBikeAggregates(rows.map(row => row.id)).pipe(
      Effect.catchTag("RatingRepositoryError", err => Effect.die(err)),
    );

    return rows.map(row => toBikeSummary(row, ratingsByBikeId[row.id]));
  });
}
