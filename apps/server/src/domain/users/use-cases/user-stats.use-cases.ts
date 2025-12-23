import { Effect } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  InvalidStatsGroupBy,
  InvalidStatsRange,
  UserStatsServiceError,
} from "../domain-errors";
import type {
  ActiveUsersSeriesRow,
  DashboardStats,
  NewUsersStats,
  TopRenterRow,
  UserStatsOverview,
} from "../models";

import { UserStatsServiceTag } from "../services/user-stats.service";

export function getUserStatsOverviewUseCase(): Effect.Effect<
  UserStatsOverview,
  UserStatsServiceError,
  UserStatsServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserStatsServiceTag;
    return yield* service.getOverviewStats();
  });
}

export function getActiveUsersSeriesUseCase(args: {
  startDate: Date;
  endDate: Date;
  groupBy: "day" | "month";
}): Effect.Effect<
  readonly ActiveUsersSeriesRow[],
  UserStatsServiceError | InvalidStatsRange | InvalidStatsGroupBy,
  UserStatsServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserStatsServiceTag;
    return yield* service.getActiveUsersSeries(args);
  });
}

export function getTopRentersUseCase(
  pageReq: PageRequest<"totalRentals">,
): Effect.Effect<
  PageResult<TopRenterRow>,
  UserStatsServiceError,
  UserStatsServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserStatsServiceTag;
    return yield* service.getTopRenters(pageReq);
  });
}

export function getNewUsersStatsUseCase(
  now: Date,
): Effect.Effect<NewUsersStats, UserStatsServiceError, UserStatsServiceTag> {
  return Effect.gen(function* () {
    const service = yield* UserStatsServiceTag;
    return yield* service.getNewUsersStats(now);
  });
}

export function getDashboardStatsUseCase(
  now: Date,
): Effect.Effect<DashboardStats, UserStatsServiceError, UserStatsServiceTag> {
  return Effect.gen(function* () {
    const service = yield* UserStatsServiceTag;
    return yield* service.getDashboardStats(now);
  });
}
