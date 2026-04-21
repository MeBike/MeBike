import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";

import type {
  StationRevenueAggregate,
  StationRevenueGroupBy,
  StationRevenuePoint,
  StationRevenueRow,
} from "../models";
import type { StationAnalyticsRepo } from "./station-analytics.repository.types";

import { StationRepositoryError } from "../errors";

export type { StationAnalyticsRepo } from "./station-analytics.repository.types";

function toRevenueBucketDate(value: Date, groupBy: StationRevenueGroupBy): Date {
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

/**
 * Xây dựng repository analytics-only cho station domain.
 *
 * Giữ revenue aggregation tách biệt khỏi các query đọc station thông thường.
 */
export function makeStationAnalyticsRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): StationAnalyticsRepo {
  const client = db;

  return {
    getRevenueByStation({ from, to }) {
      return Effect.tryPromise({
        try: async () => {
          const rows = await client.rental.groupBy({
            by: ["startStationId"],
            where: {
              status: "COMPLETED",
              endTime: {
                gte: from,
                lte: to,
              },
            },
            _count: { _all: true },
            _sum: {
              totalPrice: true,
              duration: true,
            },
            _avg: {
              duration: true,
            },
          });

          const stationIds = rows.map(row => row.startStationId);
          const stations = stationIds.length === 0
            ? []
            : await client.station.findMany({
                where: { id: { in: stationIds } },
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              });
          const stationMap = new Map(stations.map(station => [station.id, station]));

          return rows.flatMap((row): StationRevenueRow[] => {
            const station = stationMap.get(row.startStationId);
            if (!station) {
              return [];
            }

            return [{
              stationId: station.id,
              name: station.name,
              address: station.address,
              totalRentals: row._count._all,
              totalRevenue: row._sum.totalPrice === null ? 0 : Number(row._sum.totalPrice),
              totalDuration: row._sum.duration ?? 0,
              avgDuration: row._avg.duration === null ? 0 : Number(row._avg.duration.toFixed(2)),
            }];
          });
        },
        catch: cause =>
          new StationRepositoryError({
            operation: "getRevenueByStation",
            cause,
          }),
      }).pipe(defectOn(StationRepositoryError));
    },

    getRevenueForStation({ stationId, from, to }) {
      return Effect.tryPromise({
        try: async () => {
          const aggregate = await client.rental.aggregate({
            where: {
              status: "COMPLETED",
              startStationId: stationId,
              endTime: {
                gte: from,
                lte: to,
              },
            },
            _count: { _all: true },
            _sum: {
              totalPrice: true,
              duration: true,
            },
            _avg: {
              duration: true,
            },
          });

          if (aggregate._count._all === 0) {
            return null;
          }

          return {
            totalRentals: aggregate._count._all,
            totalRevenue: aggregate._sum.totalPrice === null ? 0 : Number(aggregate._sum.totalPrice),
            totalDuration: aggregate._sum.duration ?? 0,
            avgDuration: aggregate._avg.duration === null ? 0 : Number(aggregate._avg.duration.toFixed(2)),
          } satisfies StationRevenueAggregate;
        },
        catch: cause =>
          new StationRepositoryError({
            operation: "getRevenueForStation",
            cause,
          }),
      }).pipe(defectOn(StationRepositoryError));
    },

    getRevenueSeries({ from, to, groupBy, stationId }) {
      return Effect.tryPromise({
        try: async () => {
          const rows = await client.rental.findMany({
            where: {
              status: "COMPLETED",
              ...(stationId ? { startStationId: stationId } : {}),
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

          const buckets = new Map<string, StationRevenuePoint>();

          for (const row of rows) {
            if (!row.endTime) {
              continue;
            }

            const bucketDate = toRevenueBucketDate(row.endTime, groupBy);
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

          return [...buckets.values()].sort((left, right) => left.date.getTime() - right.date.getTime());
        },
        catch: cause =>
          new StationRepositoryError({
            operation: "getRevenueSeries",
            cause,
          }),
      }).pipe(defectOn(StationRepositoryError));
    },
  };
}

const makeStationAnalyticsRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeStationAnalyticsRepository(client);
});

export class StationAnalyticsRepository extends Effect.Service<StationAnalyticsRepository>()(
  "StationAnalyticsRepository",
  {
    effect: makeStationAnalyticsRepositoryEffect,
  },
) {}

export const StationAnalyticsRepositoryLive = Layer.effect(
  StationAnalyticsRepository,
  makeStationAnalyticsRepositoryEffect.pipe(Effect.map(StationAnalyticsRepository.make)),
);
