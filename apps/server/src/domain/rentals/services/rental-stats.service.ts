import { Context, Effect, Layer } from "effect";

import type { RentalRepositoryError } from "../domain-errors";
import type {
  RentalRevenueGroupBy,
  RentalRevenueStats,
  RentalSummaryStats,
  RevenueDelta,
} from "../models";

import { RentalRepository } from "../repository/rental.repository";
import { aggregateRentalStatusCounts } from "./rental-counts";
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
};

export class RentalStatsServiceTag extends Context.Tag("RentalStatsService")<
  RentalStatsServiceTag,
  RentalStatsService
>() {}

function compareRevenue(current: number, previous: number): RevenueDelta {
  const difference = current - previous;
  if (previous === 0) {
    return {
      current,
      previous,
      difference,
      percentChange: current > 0 ? 100 : 0,
    };
  }

  return {
    current,
    previous,
    difference,
    percentChange: (difference / previous) * 100,
  };
}

export const RentalStatsServiceLive = Layer.effect(
  RentalStatsServiceTag,
  Effect.gen(function* () {
    const repo = yield* RentalRepository;

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
              Cancelled: counts.CANCELLED,
              Reserved: counts.RESERVED,
            },
            dailyRevenue: compareRevenue(dailyCurrent, dailyPrevious),
            monthlyRevenue: compareRevenue(monthlyCurrent, monthlyPrevious),
          };
        }),
    };

    return service;
  }),
);
