import { Effect } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type { BikeNotFound, BikeRepositoryError } from "../domain-errors";
import type {
  BikeActivityStats,
  BikeRentalHistoryItem,
  BikeRentalHistorySortField,
  BikeRentalStats,
  HighestRevenueBike,
} from "../models";

import { BikeStatsServiceTag } from "../services/bike-stats.service";

export function getBikeRentalStatsUseCase(): Effect.Effect<
  BikeRentalStats,
  BikeRepositoryError,
  BikeStatsServiceTag
> {
  return Effect.gen(function* () {
    const svc = yield* BikeStatsServiceTag;
    return yield* svc.getRentalStats();
  });
}

export function getHighestRevenueBikeUseCase(): Effect.Effect<
  HighestRevenueBike | null,
  BikeRepositoryError,
  BikeStatsServiceTag
> {
  return Effect.gen(function* () {
    const svc = yield* BikeStatsServiceTag;
    return yield* svc.getHighestRevenueBike();
  });
}

export function getBikeActivityStatsUseCase(
  bikeId: string,
): Effect.Effect<
  BikeActivityStats,
  BikeRepositoryError | BikeNotFound,
  BikeStatsServiceTag
> {
  return Effect.gen(function* () {
    const svc = yield* BikeStatsServiceTag;
    return yield* svc.getBikeActivityStats({ bikeId });
  });
}

export function getBikeRentalHistoryUseCase(
  bikeId: string,
  pageReq: PageRequest<BikeRentalHistorySortField>,
): Effect.Effect<
  PageResult<BikeRentalHistoryItem>,
  BikeRepositoryError | BikeNotFound,
  BikeStatsServiceTag
> {
  return Effect.gen(function* () {
    const svc = yield* BikeStatsServiceTag;
    return yield* svc.getBikeRentalHistory(bikeId, pageReq);
  });
}
