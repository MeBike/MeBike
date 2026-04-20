import { Context, Effect, Layer } from "effect";

import type { RentalRepositoryError } from "../../domain-errors";
import type {
  RentalDashboardSummary,
  RentalRevenueGroupBy,
  RentalRevenueStats,
  RentalSummaryStats,
} from "../../models";

import { RentalAnalyticsRepository } from "../../repository/rental-analytics.repository";
import { aggregateRentalStatusCounts } from "./rental-counts";
import {
  comparePercentage,
  compareRevenue,
  toTrend,
} from "./rental-stats-math";
import {
  currentUtcDayRange,
  currentUtcMonthRange,
  previousUtcDayRange,
  previousUtcMonthRange,
} from "./rental-stats-time";

export type RentalStatsService = {
  getRevenueSeries: (input: {
    from: Date;
    to: Date;
    groupBy: RentalRevenueGroupBy;
  }) => Effect.Effect<RentalRevenueStats, RentalRepositoryError>;
  getSummary: (now?: Date) => Effect.Effect<RentalSummaryStats, RentalRepositoryError>;
  getDashboardSummary: (now?: Date) => Effect.Effect<RentalDashboardSummary, RentalRepositoryError>;
};

export class RentalStatsServiceTag extends Context.Tag("RentalStatsService")<
  RentalStatsServiceTag,
  RentalStatsService
>() {}

export const RentalStatsServiceLive = Layer.effect(
  RentalStatsServiceTag,
  Effect.gen(function* () {
    const repo = yield* RentalAnalyticsRepository;

    const service: RentalStatsService = {
      getRevenueSeries: ({ from, to, groupBy }) =>
        Effect.gen(function* () {
          const data = yield* repo.getRevenueSeries(from, to, groupBy);
          return {
            period: { from, to },
            groupBy,
            data,
          };
        }),

      getSummary: (now = new Date()) =>
        Effect.gen(function* () {
          const countsRows = yield* repo.getGlobalRentalCounts();
          const counts = aggregateRentalStatusCounts(countsRows);

          const today = currentUtcDayRange(now);
          const yesterday = previousUtcDayRange(now);
          const thisMonth = currentUtcMonthRange(now);
          const lastMonth = previousUtcMonthRange(now);

          const [dailyCurrent, dailyPrevious, monthlyCurrent, monthlyPrevious] = yield* Effect.all([
            repo.getCompletedRevenueTotal(today.from, today.to),
            repo.getCompletedRevenueTotal(yesterday.from, yesterday.to),
            repo.getCompletedRevenueTotal(thisMonth.from, thisMonth.to),
            repo.getCompletedRevenueTotal(lastMonth.from, lastMonth.to),
          ]);

          return {
            rentalList: {
              Rented: counts.RENTED,
              Completed: counts.COMPLETED,
            },
            dailyRevenue: compareRevenue(dailyCurrent, dailyPrevious),
            monthlyRevenue: compareRevenue(monthlyCurrent, monthlyPrevious),
          };
        }),

      getDashboardSummary: (now = new Date()) =>
        Effect.gen(function* () {
          const today = currentUtcDayRange(now);
          const yesterday = previousUtcDayRange(now);

          const [
            todayRevenue,
            yesterdayRevenue,
            todayCompletedRentals,
            yesterdayCompletedRentals,
            hourlyRentalStats,
          ] = yield* Effect.all([
            repo.getCompletedRevenueTotal(today.from, today.to),
            repo.getCompletedRevenueTotal(yesterday.from, yesterday.to),
            repo.getCompletedRentalCount(today.from, today.to),
            repo.getCompletedRentalCount(yesterday.from, yesterday.to),
            repo.getRentalStartHourlyStats(today.from, today.to),
          ]);

          return {
            revenueSummary: {
              today: {
                totalRevenue: todayRevenue,
                totalRentals: todayCompletedRentals,
              },
              yesterday: {
                totalRevenue: yesterdayRevenue,
                totalRentals: yesterdayCompletedRentals,
              },
              revenueChange: comparePercentage(todayRevenue, yesterdayRevenue),
              revenueTrend: toTrend(todayRevenue, yesterdayRevenue),
              rentalChange: comparePercentage(
                todayCompletedRentals,
                yesterdayCompletedRentals,
              ),
              rentalTrend: toTrend(
                todayCompletedRentals,
                yesterdayCompletedRentals,
              ),
            },
            hourlyRentalStats,
          };
        }),
    };

    return service;
  }),
);
