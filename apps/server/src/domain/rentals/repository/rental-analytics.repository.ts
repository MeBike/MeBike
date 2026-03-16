import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type {
  HourlyRentalStat,
  RentalRevenueGroupBy,
  RentalRevenuePoint,
} from "../models";
import type { RentalAnalyticsRepo } from "./rental-analytics.repository.types";

import { RentalRepositoryError } from "../domain-errors";

export type { RentalAnalyticsRepo } from "./rental-analytics.repository.types";

function toBucketDate(value: Date, groupBy: RentalRevenueGroupBy): Date {
  const year = value.getUTCFullYear();
  const month = value.getUTCMonth();
  const day = value.getUTCDate();

  if (groupBy === "YEAR") {
    return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  }
  if (groupBy === "MONTH") {
    return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  }
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

export function makeRentalAnalyticsRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): RentalAnalyticsRepo {
  const client = db;

  return {
    getRevenueSeries(from, to, groupBy) {
      return Effect.tryPromise({
        try: async () => {
          const rows = await client.rental.findMany({
            where: {
              status: "COMPLETED",
              endTime: {
                gte: from,
                lte: to,
              },
            },
            select: {
              endTime: true,
              totalPrice: true,
            },
          });

          const buckets = new Map<string, RentalRevenuePoint>();

          for (const row of rows) {
            if (!row.endTime) {
              continue;
            }
            const bucketDate = toBucketDate(row.endTime, groupBy);
            const key = bucketDate.toISOString();
            const amount = row.totalPrice === null ? 0 : Number(row.totalPrice);

            const current = buckets.get(key);
            if (current) {
              buckets.set(key, {
                ...current,
                totalRevenue: current.totalRevenue + amount,
                totalRentals: current.totalRentals + 1,
              });
              continue;
            }

            buckets.set(key, {
              date: bucketDate,
              totalRevenue: amount,
              totalRentals: 1,
            });
          }

          return [...buckets.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "getRevenueSeries",
            cause: e,
          }),
      });
    },

    getCompletedRevenueTotal(from, to) {
      return Effect.tryPromise({
        try: async () => {
          const result = await client.rental.aggregate({
            where: {
              status: "COMPLETED",
              endTime: {
                gte: from,
                lte: to,
              },
            },
            _sum: {
              totalPrice: true,
            },
          });

          return result._sum.totalPrice === null ? 0 : Number(result._sum.totalPrice);
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "getCompletedRevenueTotal",
            cause: e,
          }),
      });
    },

    getCompletedRentalCount(from, to) {
      return Effect.tryPromise({
        try: () =>
          client.rental.count({
            where: {
              status: "COMPLETED",
              endTime: {
                gte: from,
                lte: to,
              },
            },
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "getCompletedRentalCount",
            cause: e,
          }),
      });
    },

    getRentalStartHourlyStats(from, to) {
      return Effect.tryPromise({
        try: async () => {
          const rows = await client.rental.findMany({
            where: {
              startTime: {
                gte: from,
                lte: to,
              },
            },
            select: {
              startTime: true,
            },
          });

          const hourly = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            totalRentals: 0,
          })) as HourlyRentalStat[];

          for (const row of rows) {
            const hour = row.startTime.getUTCHours();
            const current = hourly[hour];
            if (!current) {
              continue;
            }
            current.totalRentals += 1;
          }

          return hourly;
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "getRentalStartHourlyStats",
            cause: e,
          }),
      });
    },

    getGlobalRentalCounts() {
      return Effect.tryPromise({
        try: async () => {
          const rows = await client.rental.groupBy({
            by: ["status"],
            _count: { _all: true },
          });

          return rows.map(row => ({
            status: row.status,
            count: row._count._all,
          }));
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "getGlobalRentalCounts",
            cause: e,
          }),
      });
    },
  };
}

const makeRentalAnalyticsRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeRentalAnalyticsRepository(client);
});

export class RentalAnalyticsRepository extends Effect.Service<RentalAnalyticsRepository>()(
  "RentalAnalyticsRepository",
  {
    effect: makeRentalAnalyticsRepositoryEffect,
  },
) {}

export const RentalAnalyticsRepositoryLive = Layer.effect(
  RentalAnalyticsRepository,
  makeRentalAnalyticsRepositoryEffect.pipe(
    Effect.map(RentalAnalyticsRepository.make),
  ),
);
