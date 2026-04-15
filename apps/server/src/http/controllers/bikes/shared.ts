import { BikesContracts } from "@mebike/shared";
import { Effect } from "effect";

import type { BikeRow } from "@/domain/bikes";

import { RatingRepository } from "@/domain/ratings";
import { RatingRepositoryError } from "@/domain/ratings/domain-errors";
import { defectOn } from "@/domain/shared";
import { StationQueryRepository } from "@/domain/stations";
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

function mapStationsById(
  rows: readonly { id: string; name: string; address: string }[],
) {
  return Object.fromEntries(rows.map(row => [row.id, row]));
}

export function loadBikeSummary(row: BikeRow) {
  return Effect.gen(function* () {
    const ratingRepo = yield* RatingRepository;
    const stationRepo = yield* StationQueryRepository;
    const supplierRepo = yield* SupplierRepository;
    const { rating, station, supplier } = yield* Effect.all({
      rating: ratingRepo.findBikeAggregates([row.id]).pipe(
        defectOn(RatingRepositoryError),
        Effect.map(map => map[row.id]),
      ),
      station: row.stationId
        ? stationRepo.findIdNameAddressByIds([row.stationId]).pipe(
            Effect.map(rows => rows[0] ?? null),
          )
        : Effect.succeed(null),
      supplier: row.supplierId
        ? supplierRepo.findIdNameByIds([row.supplierId]).pipe(
            Effect.map(rows => rows[0] ?? null),
          )
        : Effect.succeed(null),
    });

    return toBikeSummary(row, rating, station, supplier);
  });
}

export function loadBikeSummaries(rows: readonly BikeRow[]) {
  return Effect.gen(function* () {
    const ratingRepo = yield* RatingRepository;
    const stationRepo = yield* StationQueryRepository;
    const supplierRepo = yield* SupplierRepository;
    const ratingsByBikeId = yield* ratingRepo.findBikeAggregates(rows.map(row => row.id)).pipe(
      defectOn(RatingRepositoryError),
    );

    const stationIds = [...new Set(rows.flatMap(row => (row.stationId ? [row.stationId] : [])))];
    const stationsById = stationIds.length === 0
      ? {}
      : mapStationsById(yield* stationRepo.findIdNameAddressByIds(stationIds));

    const supplierIds = [...new Set(rows.flatMap(row => (row.supplierId ? [row.supplierId] : [])))];
    const suppliersById = supplierIds.length === 0
      ? {}
      : mapSuppliersById(yield* supplierRepo.findIdNameByIds(supplierIds));

    return rows.map(row => toBikeSummary(
      row,
      ratingsByBikeId[row.id],
      row.stationId ? stationsById[row.stationId] ?? null : null,
      row.supplierId ? suppliersById[row.supplierId] ?? null : null,
    ));
  });
}
