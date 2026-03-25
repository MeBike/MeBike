import { BikesContracts } from "@mebike/shared";
import { Effect } from "effect";

import type { BikeRow } from "@/domain/bikes";

import { RatingRepository } from "@/domain/ratings";
import { SupplierRepository } from "@/domain/suppliers";
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

function mapSuppliersById(rows: readonly { id: string; name: string }[]) {
  return Object.fromEntries(rows.map(row => [row.id, row]));
}

export function loadBikeSummary(row: BikeRow) {
  return Effect.gen(function* () {
    const ratingRepo = yield* RatingRepository;
    const supplierRepo = yield* SupplierRepository;
    const rating = yield* ratingRepo.findBikeAggregates([row.id]).pipe(
      Effect.catchTag("RatingRepositoryError", err => Effect.die(err)),
      Effect.map(map => map[row.id]),
    );

    const supplier = row.supplierId
      ? yield* supplierRepo.findIdNameByIds([row.supplierId]).pipe(
        Effect.map(rows => rows[0] ?? null),
      )
      : null;

    return toBikeSummary(row, rating, supplier);
  });
}

export function loadBikeSummaries(rows: readonly BikeRow[]) {
  return Effect.gen(function* () {
    const ratingRepo = yield* RatingRepository;
    const supplierRepo = yield* SupplierRepository;
    const ratingsByBikeId = yield* ratingRepo.findBikeAggregates(rows.map(row => row.id)).pipe(
      Effect.catchTag("RatingRepositoryError", err => Effect.die(err)),
    );

    const supplierIds = [...new Set(rows.flatMap(row => (row.supplierId ? [row.supplierId] : [])))];
    const suppliersById = supplierIds.length === 0
      ? {}
      : mapSuppliersById(yield* supplierRepo.findIdNameByIds(supplierIds));

    return rows.map(row => toBikeSummary(
      row,
      ratingsByBikeId[row.id],
      row.supplierId ? suppliersById[row.supplierId] ?? null : null,
    ));
  });
}
