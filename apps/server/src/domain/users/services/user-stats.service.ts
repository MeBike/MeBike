import { Context, Effect, Layer } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  ActiveUsersSeriesRow,
  DashboardStats,
  NewUsersStats,
  TopRenterRow,
  UserStatsOverview,
} from "../models";
import type { UserStatsRepo } from "../repository/user-stats.repository";

import {
  InvalidStatsGroupBy,
  InvalidStatsRange,
  UserStatsServiceError,
} from "../domain-errors";
import { UserStatsRepository } from "../repository/user-stats.repository";
import { computeMonthRange, computeNewUsersRanges } from "./user-stats-time";

export type UserStatsService = {
  readonly getOverviewStats: () => Effect.Effect<
    UserStatsOverview,
    UserStatsServiceError
  >;
  readonly getActiveUsersSeries: (args: {
    readonly startDate: Date;
    readonly endDate: Date;
    readonly groupBy: "day" | "month";
  }) => Effect.Effect<
    readonly ActiveUsersSeriesRow[],
    UserStatsServiceError | InvalidStatsRange | InvalidStatsGroupBy
  >;
  readonly getTopRenters: (
    pageReq: PageRequest<"totalRentals">,
  ) => Effect.Effect<PageResult<TopRenterRow>, UserStatsServiceError>;
  readonly getNewUsersStats: (now: Date) => Effect.Effect<
    NewUsersStats,
    UserStatsServiceError
  >;
  readonly getDashboardStats: (now: Date) => Effect.Effect<
    DashboardStats,
    UserStatsServiceError
  >;
};

export class UserStatsServiceTag extends Context.Tag("UserStatsServiceTag")<
  UserStatsServiceTag,
  UserStatsService
>() {}

export function makeUserStatsService(repo: UserStatsRepo): UserStatsService {
  return {
    getOverviewStats: () =>
      repo.getOverviewStats().pipe(
        Effect.mapError(
          cause =>
            new UserStatsServiceError({
              message: "stats.overview",
              cause,
            }),
        ),
      ),

    getActiveUsersSeries: ({ startDate, endDate, groupBy }) =>
      Effect.gen(function* () {
        if (startDate > endDate) {
          return yield* Effect.fail(new InvalidStatsRange({ startDate, endDate }));
        }

        if (groupBy !== "day" && groupBy !== "month") {
          return yield* Effect.fail(new InvalidStatsGroupBy({ groupBy }));
        }

        const rows = yield* repo
          .getActiveUsersSeries({ startDate, endDate, groupBy })
          .pipe(
            Effect.mapError(
              cause =>
                new UserStatsServiceError({
                  message: "stats.activeUsers",
                  cause,
                }),
            ),
          );

        return rows;
      }),

    getTopRenters: pageReq =>
      repo.getTopRenters(pageReq).pipe(
        Effect.mapError(
          cause =>
            new UserStatsServiceError({
              message: "stats.topRenters",
              cause,
            }),
        ),
      ),

    getNewUsersStats: now =>
      Effect.gen(function* () {
        const ranges = computeNewUsersRanges(now);

        const counts = yield* repo
          .getNewUsersCounts(ranges)
          .pipe(
            Effect.mapError(
              cause =>
                new UserStatsServiceError({
                  message: "stats.newUsers",
                  cause,
                }),
            ),
          );

        const percentageChange
          = counts.lastMonth === 0
            ? counts.thisMonth === 0
              ? 0
              : 100
            : ((counts.thisMonth - counts.lastMonth) / counts.lastMonth) * 100;

        return {
          newUsersThisMonth: counts.thisMonth,
          newUsersLastMonth: counts.lastMonth,
          percentageChange,
        };
      }),

    getDashboardStats: now =>
      Effect.gen(function* () {
        const { monthStart, monthEnd } = computeMonthRange(now);

        const raw = yield* repo
          .getDashboardStatsRaw({ monthStart, monthEnd })
          .pipe(
            Effect.mapError(
              cause =>
                new UserStatsServiceError({
                  message: "stats.dashboard",
                  cause,
                }),
            ),
          );

        const averageSpending
          = raw.totalCustomers === 0
            ? 0
            : raw.totalRevenue / raw.totalCustomers;

        return {
          totalCustomers: raw.totalCustomers,
          activeCustomers: raw.activeCustomers,
          newCustomersThisMonth: raw.newCustomersThisMonth,
          vipCustomer: raw.vipCustomer,
          totalRevenue: raw.totalRevenue,
          averageSpending,
        };
      }),
  };
}

export const UserStatsServiceLive = Layer.effect(
  UserStatsServiceTag,
  Effect.gen(function* () {
    const repo = yield* UserStatsRepository;
    return makeUserStatsService(repo);
  }),
);
