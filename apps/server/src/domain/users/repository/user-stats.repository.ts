import type { Kysely } from "kysely";

import { Context, Effect, Layer } from "effect";
import { sql } from "kysely";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { DB } from "generated/kysely/types";

import { db } from "@/database";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { UserRole, UserVerifyStatus } from "generated/prisma/client";

import type {
  ActiveUsersSeriesRow,
  DashboardStatsRaw,
  NewUsersCounts,
  TopRenterRow,
  UserStatsOverview,
} from "../models";
import type { TopRenterRowRaw, VipCustomerRowRaw } from "./user-stats.mappers";

import { UserRepositoryError } from "../domain-errors";
import {
  mapTopRenterRows,
  selectVipCustomer,

} from "./user-stats.mappers";

export type UserStatsRepo = {
  readonly getOverviewStats: () => Effect.Effect<UserStatsOverview, UserRepositoryError>;
  readonly getActiveUsersSeries: (args: {
    startDate: Date;
    endDate: Date;
    groupBy: "day" | "month";
  }) => Effect.Effect<readonly ActiveUsersSeriesRow[], UserRepositoryError>;
  readonly getTopRenters: (
    pageReq: PageRequest<"totalRentals">,
  ) => Effect.Effect<PageResult<TopRenterRow>, UserRepositoryError>;
  readonly getNewUsersCounts: (args: {
    thisMonthStart: Date;
    thisMonthEnd: Date;
    lastMonthStart: Date;
    lastMonthEnd: Date;
  }) => Effect.Effect<NewUsersCounts, UserRepositoryError>;
  readonly getDashboardStatsRaw: (args: {
    monthStart: Date;
    monthEnd: Date;
  }) => Effect.Effect<DashboardStatsRaw, UserRepositoryError>;
};

export class UserStatsRepository extends Context.Tag("UserStatsRepository")<
  UserStatsRepository,
  UserStatsRepo
>() {}

type ActiveUsersRowRaw = {
  bucket: Date;
  active_users_count: number;
};

export function makeUserStatsRepository(db: Kysely<DB>): UserStatsRepo {
  const withOp = <A>(operation: string, run: () => Promise<A>) =>
    Effect.tryPromise({
      try: run,
      catch: cause => new UserRepositoryError({ operation, cause }),
    });

  return {
    getOverviewStats: () =>
      Effect.gen(function* () {
        const [totalUsers, totalVerified, totalUnverified, totalBanned]
          = yield* Effect.all([
            withOp("stats.totalUsers", async () => {
              const row = await db
                .selectFrom("User")
                .select(sql<number>`count(*)`.as("count"))
                .executeTakeFirst();
              return Number(row?.count ?? 0);
            }),
            withOp("stats.totalVerified", async () => {
              const row = await db
                .selectFrom("User")
                .select(sql<number>`count(*)`.as("count"))
                .where("verify", "=", UserVerifyStatus.VERIFIED)
                .executeTakeFirst();
              return Number(row?.count ?? 0);
            }),
            withOp("stats.totalUnverified", async () => {
              const row = await db
                .selectFrom("User")
                .select(sql<number>`count(*)`.as("count"))
                .where("verify", "=", UserVerifyStatus.UNVERIFIED)
                .executeTakeFirst();
              return Number(row?.count ?? 0);
            }),
            withOp("stats.totalBanned", async () => {
              const row = await db
                .selectFrom("User")
                .select(sql<number>`count(*)`.as("count"))
                .where("verify", "=", UserVerifyStatus.BANNED)
                .executeTakeFirst();
              return Number(row?.count ?? 0);
            }),
          ]);

        return {
          totalUsers,
          totalVerified,
          totalUnverified,
          totalBanned,
        };
      }),

    getActiveUsersSeries: ({ startDate, endDate, groupBy }) => {
      const bucketExpr
        = groupBy === "month"
          ? sql<Date>`date_trunc('month', "occurred_at")`
          : sql<Date>`date_trunc('day', "occurred_at")`;

      return withOp("stats.activeUsers", () =>
        db
          .selectFrom("AuthEvent")
          .select([
            bucketExpr.as("bucket"),
            sql<number>`count(distinct "user_id")`.as("active_users_count"),
          ])
          .where("occurred_at", ">=", startDate)
          .where("occurred_at", "<=", endDate)
          .groupBy(bucketExpr)
          .orderBy("bucket", "asc")
          .execute() as Promise<ActiveUsersRowRaw[]>).pipe(
        Effect.map(rows =>
          rows.map(row => ({
            date: row.bucket.toISOString().slice(0, 10),
            activeUsersCount: Number(row.active_users_count),
          })),
        ),
      );
    },

    getTopRenters: pageReq =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const rows = yield* withOp("stats.topRenters", () =>
          db
            .with("rental_counts", qb =>
              qb
                .selectFrom("Rental")
                .select([
                  "user_id",
                  sql<number>`count(*)`.as("total_rentals"),
                ])
                .where("status", "=", "COMPLETED")
                .groupBy("user_id"))
            .with("ranked", qb =>
              qb
                .selectFrom("rental_counts")
                .innerJoin("User", "User.id", "rental_counts.user_id")
                .select([
                  "rental_counts.user_id as user_id",
                  "rental_counts.total_rentals as total_rentals",
                  "User.fullname as fullname",
                  "User.email as email",
                  "User.avatar as avatar",
                  "User.phone_number as phone_number",
                  "User.location as location",
                ]))
            .selectFrom("ranked")
            .select([
              "user_id",
              "total_rentals",
              "fullname",
              "email",
              "avatar",
              "phone_number",
              "location",
              sql<number>`count(*) over()`.as("total_records"),
            ])
            .orderBy("total_rentals", "desc")
            .limit(take)
            .offset(skip)
            .execute() as Promise<TopRenterRowRaw[]>);

        const { items, totalRecords } = mapTopRenterRows(rows);
        return makePageResult(items, totalRecords, page, pageSize);
      }),

    getNewUsersCounts: ({ thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd }) =>
      Effect.gen(function* () {
        const [thisMonth, lastMonth] = yield* Effect.all([
          withOp("stats.newUsers.thisMonth", async () => {
            const row = await db
              .selectFrom("User")
              .select(sql<number>`count(*)`.as("count"))
              .where("created_at", ">=", thisMonthStart)
              .where("created_at", "<=", thisMonthEnd)
              .executeTakeFirst();
            return Number(row?.count ?? 0);
          }),
          withOp("stats.newUsers.lastMonth", async () => {
            const row = await db
              .selectFrom("User")
              .select(sql<number>`count(*)`.as("count"))
              .where("created_at", ">=", lastMonthStart)
              .where("created_at", "<=", lastMonthEnd)
              .executeTakeFirst();
            return Number(row?.count ?? 0);
          }),
        ]);

        return { thisMonth, lastMonth };
      }),

    getDashboardStatsRaw: ({ monthStart, monthEnd }) =>
      Effect.gen(function* () {
        const [
          totalCustomers,
          activeCustomers,
          newCustomersThisMonth,
          totalRevenue,
          vipRows,
        ] = yield* Effect.all([
          withOp("stats.dashboard.totalCustomers", async () => {
            const row = await db
              .selectFrom("User")
              .select(sql<number>`count(*)`.as("count"))
              .where("role", "=", UserRole.USER)
              .executeTakeFirst();
            return Number(row?.count ?? 0);
          }),
          withOp("stats.dashboard.activeCustomers", async () => {
            const row = await db
              .selectFrom("User")
              .select(sql<number>`count(*)`.as("count"))
              .where("role", "=", UserRole.USER)
              .where("verify", "=", UserVerifyStatus.VERIFIED)
              .executeTakeFirst();
            return Number(row?.count ?? 0);
          }),
          withOp("stats.dashboard.newCustomersThisMonth", async () => {
            const row = await db
              .selectFrom("User")
              .select(sql<number>`count(*)`.as("count"))
              .where("role", "=", UserRole.USER)
              .where("created_at", ">=", monthStart)
              .where("created_at", "<=", monthEnd)
              .executeTakeFirst();
            return Number(row?.count ?? 0);
          }),
          withOp("stats.dashboard.totalRevenue", async () => {
            const row = await db
              .selectFrom("Rental")
              .select(
                sql<number>`coalesce(sum("total_price"), 0)`.as("total_revenue"),
              )
              .where("status", "=", "COMPLETED")
              .executeTakeFirst();
            return Number(row?.total_revenue ?? 0);
          }),
          withOp("stats.dashboard.vipCustomer", () =>
            db
              .selectFrom("Rental")
              .innerJoin("User", "User.id", "Rental.user_id")
              .select([
                "Rental.user_id as user_id",
                "User.fullname as fullname",
                sql<number>`coalesce(sum("Rental"."duration"), 0)`.as(
                  "total_duration",
                ),
              ])
              .where("Rental.status", "=", "COMPLETED")
              .groupBy("Rental.user_id")
              .groupBy("User.fullname")
              .orderBy("total_duration", "desc")
              .limit(1)
              .execute() as Promise<VipCustomerRowRaw[]>),
        ]);

        const revenueValue = totalRevenue;
        const vipCustomer = selectVipCustomer(vipRows);

        return {
          totalCustomers,
          activeCustomers,
          newCustomersThisMonth,
          vipCustomer,
          totalRevenue: revenueValue,
        };
      }),
  };
}

export const UserStatsRepositoryLive = Layer.succeed(
  UserStatsRepository,
  makeUserStatsRepository(db),
);
