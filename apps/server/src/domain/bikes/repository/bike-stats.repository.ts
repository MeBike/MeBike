import type { Kysely } from "kysely";

import { Context, Effect, Layer } from "effect";
import { sql } from "kysely";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { DB } from "generated/kysely/types";

import { db } from "@/database";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";

import type {
  BikeActivityStatsRaw,
  BikeRentalHistoryItem,
  BikeRentalHistorySortField,
  BikeRentalStats,
  HighestRevenueBike,
} from "../models";
import type { RentalHistoryRowRaw } from "./bike-stats.mapper";

import { BikeRepositoryError } from "../domain-errors";
import { toBikeRentalHistoryItem } from "./bike-stats.mapper";

export type BikeStatsRepo = {
  readonly getRentalStats: () => Effect.Effect<BikeRentalStats, BikeRepositoryError>;
  readonly getHighestRevenueBike: () => Effect.Effect<HighestRevenueBike | null, BikeRepositoryError>;
  readonly getBikeActivityStats: (args: {
    bikeId: string;
    now: Date;
    months: number;
  }) => Effect.Effect<BikeActivityStatsRaw, BikeRepositoryError>;
  readonly getBikeRentalHistory: (
    bikeId: string,
    pageReq: PageRequest<BikeRentalHistorySortField>,
  ) => Effect.Effect<PageResult<BikeRentalHistoryItem>, BikeRepositoryError>;
};

export class BikeStatsRepository extends Context.Tag("BikeStatsRepository")<
  BikeStatsRepository,
  BikeStatsRepo
>() {}

type MonthlyStatsRowRaw = {
  year: number;
  month: number;
  rentals_count: number;
  minutes_active: number;
  revenue: number;
};

export function makeBikeStatsRepository(db: Kysely<DB>): BikeStatsRepo {
  const withOp = <A>(operation: string, run: () => Promise<A>) =>
    Effect.tryPromise({
      try: run,
      catch: cause => new BikeRepositoryError({ operation, cause }),
    });

  return {
    getRentalStats: () =>
      withOp("stats.rentalStats", async () => {
        const row = await db
          .selectFrom("Bike")
          .select([
            sql<number>`count(*) filter (where status <> 'UNAVAILABLE')`.as(
              "total_active",
            ),
            sql<number>`count(*) filter (where status = 'BOOKED')`.as(
              "rented_bikes",
            ),
          ])
          .executeTakeFirst();

        const totalActiveBikes = Number(row?.total_active ?? 0);
        const rentedBikes = Number(row?.rented_bikes ?? 0);
        const percentage
          = totalActiveBikes === 0
            ? 0
            : (rentedBikes / totalActiveBikes) * 100;

        return { totalActiveBikes, rentedBikes, percentage };
      }),

    getHighestRevenueBike: () =>
      withOp("stats.highestRevenueBike", async () => {
        const row = await db
          .selectFrom("Rental")
          .innerJoin("Bike", "Bike.id", "Rental.bike_id")
          .leftJoin("Station", "Station.id", "Bike.stationId")
          .select([
            "Bike.id as bike_id",
            "Bike.chip_id as chip_id",
            "Station.id as station_id",
            "Station.name as station_name",
            sql<number>`sum("Rental"."total_price"::numeric)`.as("total_revenue"),
            sql<number>`count(*)`.as("rental_count"),
          ])
          .where("Rental.status", "=", "COMPLETED")
          .where("Rental.total_price", "is not", null)
          .groupBy([
            "Bike.id",
            "Bike.chip_id",
            "Station.id",
            "Station.name",
          ])
          .orderBy(sql`total_revenue`, "desc")
          .limit(1)
          .executeTakeFirst();

        if (!row) {
          return null;
        }

        return {
          bikeId: row.bike_id,
          bikeChipId: row.chip_id,
          totalRevenue: Number(row.total_revenue ?? 0),
          rentalCount: Number(row.rental_count ?? 0),
          station: row.station_id
            ? { id: row.station_id, name: row.station_name ?? "" }
            : null,
        };
      }),

    getBikeActivityStats: ({ bikeId, now, months }) =>
      Effect.gen(function* () {
        const since = new Date(now);
        since.setUTCDate(1);
        since.setUTCHours(0, 0, 0, 0);
        since.setUTCMonth(since.getUTCMonth() - (months - 1));

        const [totals, monthly, minStart] = yield* Effect.all([
          withOp("stats.activityTotals", () =>
            db
              .selectFrom("Rental")
              .select([
                sql<number>`coalesce(sum("duration"), 0)`.as(
                  "total_minutes",
                ),
                sql<number>`coalesce(sum("total_price"::numeric), 0)`.as(
                  "total_revenue",
                ),
              ])
              .where("bike_id", "=", bikeId)
              .where("status", "=", "COMPLETED")
              .executeTakeFirst()),
          withOp("stats.activityMonthly", () =>
            db
              .selectFrom("Rental")
              .select([
                sql<number>`extract(year from "end_time")`.as("year"),
                sql<number>`extract(month from "end_time")`.as("month"),
                sql<number>`count(*)`.as("rentals_count"),
                sql<number>`coalesce(sum("duration"), 0)`.as("minutes_active"),
                sql<number>`coalesce(sum("total_price"::numeric), 0)`.as(
                  "revenue",
                ),
              ])
              .where("bike_id", "=", bikeId)
              .where("status", "=", "COMPLETED")
              .where("end_time", ">=", since)
              .where("end_time", "<=", now)
              .groupBy([
                sql`extract(year from "end_time")`,
                sql`extract(month from "end_time")`,
              ])
              .orderBy(sql`year`, "asc")
              .orderBy(sql`month`, "asc")
              .execute() as Promise<MonthlyStatsRowRaw[]>),
          withOp("stats.activityMinStart", () =>
            db
              .selectFrom("Rental")
              .select(sql<Date>`min("start_time")`.as("min_start"))
              .where("bike_id", "=", bikeId)
              .executeTakeFirst()),
        ]);

        return {
          totalMinutesActive: Number(totals?.total_minutes ?? 0),
          totalRevenue: Number(totals?.total_revenue ?? 0),
          minStartTime: (minStart as { min_start?: Date | null })?.min_start
            ?? null,
          monthly: monthly.map(row => ({
            year: Number(row.year),
            month: Number(row.month),
            rentalsCount: Number(row.rentals_count),
            minutesActive: Number(row.minutes_active),
            revenue: Number(row.revenue),
          })),
        };
      }),

    getBikeRentalHistory: (bikeId, pageReq) =>
      Effect.gen(function* () {
        const {
          page,
          pageSize,
          skip,
          take,
        } = normalizedPage(pageReq);
        const orderBy = pageReq.sortBy ?? "endTime";
        const direction = pageReq.sortDir ?? "desc";

        const rows = yield* withOp("stats.rentalHistory", () =>
          db
            .selectFrom("Rental")
            .innerJoin("User", "User.id", "Rental.user_id")
            .innerJoin("Station as StartStation", "StartStation.id", "Rental.start_station")
            .leftJoin("Station as EndStation", "EndStation.id", "Rental.end_station")
            .select([
              "Rental.id as id",
              "Rental.start_time as start_time",
              "Rental.end_time as end_time",
              "Rental.duration as duration",
              "Rental.total_price as total_price",
              "User.id as user_id",
              "User.fullname as fullname",
              "StartStation.id as start_station_id",
              "StartStation.name as start_station_name",
              "EndStation.id as end_station_id",
              "EndStation.name as end_station_name",
              sql<number>`count(*) over()`.as("total_records"),
            ])
            .where("Rental.bike_id", "=", bikeId)
            .where("Rental.status", "=", "COMPLETED")
            .orderBy(
              orderBy === "startTime"
                ? "Rental.start_time"
                : orderBy === "totalPrice"
                  ? "Rental.total_price"
                  : orderBy === "duration"
                    ? "Rental.duration"
                    : "Rental.end_time",
              direction,
            )
            .limit(take)
            .offset(skip)
            .execute() as Promise<RentalHistoryRowRaw[]>);

        const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;
        const items: BikeRentalHistoryItem[] = rows.map(toBikeRentalHistoryItem);

        return makePageResult(items, totalRecords, page, pageSize);
      }),
  };
}

export const BikeStatsRepositoryLive = Layer.succeed(
  BikeStatsRepository,
  makeBikeStatsRepository(db),
);
