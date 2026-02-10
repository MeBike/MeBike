import type { Kysely } from "kysely";

import { Effect, Either } from "effect";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { DB } from "generated/kysely/types";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { seed } from "@/test/db/seed";
import { getTestDatabase } from "@/test/db/test-database";

import type { UserStatsRepo } from "../user-stats.repository";

import { makeUserStatsRepository } from "../user-stats.repository";

describe("userStatsRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let testDb: Kysely<DB>;
  let repo: UserStatsRepo;

  beforeAll(async () => {
    container = await getTestDatabase();

    testDb = makeTestDb(container.url);

    await seed(testDb);

    repo = makeUserStatsRepository(testDb);
  }, 60000);

  afterAll(async () => {
    if (testDb)
      await destroyTestDb(testDb);
    if (container)
      await container.stop();
  });

  it("getOverviewStats: returns correct counts", async () => {
    const result = await Effect.runPromise(repo.getOverviewStats());
    expect(result).toEqual({
      totalUsers: 3,
      totalVerified: 1,
      totalUnverified: 1,
      totalBanned: 1,
    });
  });

  it("getActiveUsersSeries: groups by day", async () => {
    const result = await Effect.runPromise(
      repo.getActiveUsersSeries({
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-02-01"),
        groupBy: "day",
      }),
    );

    // We expect 2 days with events in Jan
    expect(result).toHaveLength(2);
    expect(result[0].date).toContain("2024-01-20");
    expect(result[0].activeUsersCount).toBe(1);
    expect(result[1].date).toContain("2024-01-21");
  });

  it("getActiveUsersSeries: groups by month", async () => {
    const result = await Effect.runPromise(
      repo.getActiveUsersSeries({
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-01"),
        groupBy: "month",
      }),
    );

    expect(result).toHaveLength(2);
    expect(result[0].date).toContain("2024-01-01");
    expect(result[1].date).toContain("2024-02-01");
  });

  it("getTopRenters: returns ranked users", async () => {
    const result = await Effect.runPromise(
      repo.getTopRenters({ page: 1, pageSize: 10 }),
    );

    expect(result.items).toHaveLength(1);
    const topRenter = result.items[0];
    expect(topRenter.user.email).toBe("verified@example.com");
    expect(topRenter.totalRentals).toBe(2);
    expect(result.total).toBe(1);
  });

  it("getNewUsersCounts: counts users by month range", async () => {
    const result = await Effect.runPromise(
      repo.getNewUsersCounts({
        // verified user created in Jan
        thisMonthStart: new Date("2024-01-01"),
        thisMonthEnd: new Date("2024-01-31"),
        // unverified user created in Feb
        lastMonthStart: new Date("2024-02-01"),
        lastMonthEnd: new Date("2024-02-29"),
      }),
    );

    // Verified + Banned in Jan = 2?
    // Banned: 2024-01-01. Verified: 2024-01-15. -> 2 users in "thisMonth" (Jan)
    // Unverified: 2024-02-15. -> 1 user in "lastMonth" (Feb)
    expect(result.thisMonth).toBe(2);
    expect(result.lastMonth).toBe(1);
  });

  it("getDashboardStatsRaw: aggregates dashboard data", async () => {
    const result = await Effect.runPromise(
      repo.getDashboardStatsRaw({
        monthStart: new Date("2024-01-01"),
        monthEnd: new Date("2024-01-31"),
      }),
    );

    // Total Customers (Role USER) = 3 (Verified, Unverified, Banned)
    // Active Customers (Verified) = 1
    expect(result.totalCustomers).toBe(3);
    expect(result.activeCustomers).toBe(1);

    // New Customers This Month (Jan) = 2 (Verified, Banned)
    expect(result.newCustomersThisMonth).toBe(2);

    // Total Revenue (Completed Rentals) = 100000 + 200000 = 300000
    expect(result.totalRevenue).toBe(300000);

    // VIP Customer (Max Duration)
    expect(result.vipCustomer).not.toBeNull();
    expect(result.vipCustomer?.fullname).toBe("Verified User");
    expect(result.vipCustomer?.totalDuration).toBe(180); // 60 + 120
  });

  describe("failure Scenarios", () => {
    it("returns UserRepositoryError when database connection is broken", async () => {
      const invalidDb = makeTestDb(
        "postgresql://invalid:invalid@localhost:54321/invalid",
        { connectionTimeoutMillis: 100 },
      );

      const brokenRepo = makeUserStatsRepository(invalidDb);

      const result = await Effect.runPromise(brokenRepo.getOverviewStats().pipe(Effect.either));

      if (Either.isLeft(result)) {
        const error = result.left;
        expect(error._tag).toBe("UserRepositoryError");
        expect(error.operation).toBe("stats.totalUsers");
      }
      else {
        throw new Error("Expected failure but got success");
      }
    });
  });
});
