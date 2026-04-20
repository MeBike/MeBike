import type { Effect } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type { BikeNotFound, BikeRepositoryError } from "../../domain-errors";
import type {
  BikeActivityStats,
  BikeRentalHistoryItem,
  BikeRentalHistorySortField,
  BikeRentalStats,
  BikeStatistics,
  BikeStats,
  HighestRevenueBike,
} from "../../models";

export type BikeStatsService = {
  readonly getRentalStats: () => Effect.Effect<
    BikeRentalStats,
    BikeRepositoryError
  >;
  readonly getBikeStatistics: () => Effect.Effect<
    BikeStatistics,
    BikeRepositoryError
  >;
  readonly getBikeStatsById: (bikeId: string) => Effect.Effect<
    BikeStats,
    BikeRepositoryError | BikeNotFound
  >;
  readonly getHighestRevenueBike: () => Effect.Effect<
    HighestRevenueBike | null,
    BikeRepositoryError
  >;
  readonly getBikeActivityStats: (args: {
    bikeId: string;
    now?: Date;
  }) => Effect.Effect<BikeActivityStats, BikeRepositoryError | BikeNotFound>;
  readonly getBikeRentalHistory: (
    bikeId: string,
    pageReq: PageRequest<BikeRentalHistorySortField>,
  ) => Effect.Effect<
    PageResult<BikeRentalHistoryItem>,
    BikeRepositoryError | BikeNotFound
  >;
};
