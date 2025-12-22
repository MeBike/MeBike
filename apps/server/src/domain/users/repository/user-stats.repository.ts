import { Context, Effect, Layer } from "effect";
import { sql } from "kysely";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { db } from "@/database";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";

import type {
  ActiveUsersSeriesRow,
  DashboardStatsRaw,
  NewUsersCounts,
  TopRenterRow,
  UserStatsOverview,
} from "../models";

import { UserRole, UserVerifyStatus } from "../../../../generated/prisma/client";
import { UserRepositoryError } from "../domain-errors";

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

type TopRenterRowRaw = {
  user_id: string;
  total_rentals: number;
  fullname: string;
  email: string;
  avatar: string | null;
  phone_number: string | null;
  location: string | null;
  total_records: number;
};

type VipCustomerRowRaw = {
  user_id: string;
  fullname: string;
  total_duration: number;
};

export function makeUserStatsRepository(): UserStatsRepo {
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
              return row?.count ?? 0;
            }),
            withOp("stats.totalVerified", async () => {
              const row = await db
                .selectFrom("User")
                .select(sql<number>`count(*)`.as("count"))
                .where("verify", "=", UserVerifyStatus.VERIFIED)
                .executeTakeFirst();
              return row?.count ?? 0;
            }),
            withOp("stats.totalUnverified", async () => {
              const row = await db
                .selectFrom("User")
                .select(sql<number>`count(*)`.as("count"))
                .where("verify", "=", UserVerifyStatus.UNVERIFIED)
                .executeTakeFirst();
              return row?.count ?? 0;
            }),
            withOp("stats.totalBanned", async () => {
              const row = await db
                .selectFrom("User")
                .select(sql<number>`count(*)`.as("count"))
                .where("verify", "=", UserVerifyStatus.BANNED)
                .executeTakeFirst();
              return row?.count ?? 0;
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
            activeUsersCount: row.active_users_count,
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

        const totalRecords = rows.length > 0 ? rows[0].total_records : 0;
        const items: TopRenterRow[] = rows.map(row => ({
          totalRentals: row.total_rentals,
          user: {
            id: row.user_id,
            fullname: row.fullname,
            email: row.email,
            avatar: row.avatar,
            phoneNumber: row.phone_number,
            location: row.location,
          },
        }));

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
            return row?.count ?? 0;
          }),
          withOp("stats.newUsers.lastMonth", async () => {
            const row = await db
              .selectFrom("User")
              .select(sql<number>`count(*)`.as("count"))
              .where("created_at", ">=", lastMonthStart)
              .where("created_at", "<=", lastMonthEnd)
              .executeTakeFirst();
            return row?.count ?? 0;
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
            return row?.count ?? 0;
          }),
          withOp("stats.dashboard.activeCustomers", async () => {
            const row = await db
              .selectFrom("User")
              .select(sql<number>`count(*)`.as("count"))
              .where("role", "=", UserRole.USER)
              .where("verify", "=", UserVerifyStatus.VERIFIED)
              .executeTakeFirst();
            return row?.count ?? 0;
          }),
          withOp("stats.dashboard.newCustomersThisMonth", async () => {
            const row = await db
              .selectFrom("User")
              .select(sql<number>`count(*)`.as("count"))
              .where("role", "=", UserRole.USER)
              .where("created_at", ">=", monthStart)
              .where("created_at", "<=", monthEnd)
              .executeTakeFirst();
            return row?.count ?? 0;
          }),
          withOp("stats.dashboard.totalRevenue", async () => {
            const row = await db
              .selectFrom("Rental")
              .select(
                sql<number>`coalesce(sum("total_price"), 0)`.as("total_revenue"),
              )
              .where("status", "=", "COMPLETED")
              .executeTakeFirst();
            return row?.total_revenue ?? 0;
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
        const vipCustomer
          = vipRows.length > 0
            ? {
                userId: vipRows[0].user_id,
                fullname: vipRows[0].fullname,
                totalDuration: vipRows[0].total_duration,
              }
            : null;

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

export const UserStatsRepositoryLive = Layer.effect(
  UserStatsRepository,
  Effect.sync(() => makeUserStatsRepository()),
);
