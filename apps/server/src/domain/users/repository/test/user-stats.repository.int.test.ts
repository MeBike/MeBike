import { beforeAll, describe, expect, it } from "vitest";

import { UserRepositoryError } from "@/domain/users/domain-errors";
import { makeTestDb } from "@/test/db/kysely";
import { expectDefect } from "@/test/effect/assertions";
import { runEffect } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeUserStatsRepository } from "../user-stats.repository";

describe("userStatsRepository Integration", () => {
  const fixture = setupPrismaIntFixture({ seedBase: true });
  let repo: ReturnType<typeof makeUserStatsRepository>;

  beforeAll(() => {
    repo = makeUserStatsRepository(fixture.db);
  });

  it("getOverviewStats: returns correct counts", async () => {
    const result = await runEffect(repo.getOverviewStats());
    expect(result).toEqual({
      totalUsers: 3,
      totalVerified: 1,
      totalUnverified: 1,
      totalBanned: 1,
    });
  });

  it("getActiveUsersSeries: groups by day", async () => {
    const result = await runEffect(repo.getActiveUsersSeries({
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-02-01"),
      groupBy: "day",
    }));

    expect(result).toHaveLength(2);
    expect(result[0].date).toContain("2024-01-20");
    expect(result[0].activeUsersCount).toBe(1);
    expect(result[1].date).toContain("2024-01-21");
  });

  it("getActiveUsersSeries: groups by month", async () => {
    const result = await runEffect(repo.getActiveUsersSeries({
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-03-01"),
      groupBy: "month",
    }));

    expect(result).toHaveLength(2);
    expect(result[0].date).toContain("2024-01-01");
    expect(result[1].date).toContain("2024-02-01");
  });

  it("getTopRenters: returns ranked users", async () => {
    const result = await runEffect(repo.getTopRenters({ page: 1, pageSize: 10 }));

    expect(result.items).toHaveLength(1);
    const topRenter = result.items[0];
    expect(topRenter.user.email).toBe("verified@example.com");
    expect(topRenter.totalRentals).toBe(2);
    expect(result.total).toBe(1);
  });

  it("getNewUsersCounts: counts users by month range", async () => {
    const result = await runEffect(repo.getNewUsersCounts({
      thisMonthStart: new Date("2024-01-01"),
      thisMonthEnd: new Date("2024-01-31"),
      lastMonthStart: new Date("2024-02-01"),
      lastMonthEnd: new Date("2024-02-29"),
    }));

    expect(result.thisMonth).toBe(2);
    expect(result.lastMonth).toBe(1);
  });

  it("getDashboardStatsRaw: aggregates dashboard data", async () => {
    const result = await runEffect(repo.getDashboardStatsRaw({
      monthStart: new Date("2024-01-01"),
      monthEnd: new Date("2024-01-31"),
    }));

    expect(result.totalCustomers).toBe(3);
    expect(result.activeCustomers).toBe(1);
    expect(result.newCustomersThisMonth).toBe(2);
    expect(result.totalRevenue).toBe(300000);
    expect(result.vipCustomer).not.toBeNull();
    expect(result.vipCustomer?.fullName).toBe("Verified User");
    expect(result.vipCustomer?.totalDuration).toBe(180);
  });

  describe("failure Scenarios", () => {
    it("defects with UserRepositoryError when database connection is broken", async () => {
      const invalidDb = makeTestDb(
        "postgresql://invalid:invalid@localhost:54321/invalid",
        { connectionTimeoutMillis: 100 },
      );

      const brokenRepo = makeUserStatsRepository(invalidDb);

      await expectDefect(
        brokenRepo.getOverviewStats(),
        UserRepositoryError,
        { operation: "stats.totalUsers" },
      );

      await invalidDb.destroy();
    });
  });
});
