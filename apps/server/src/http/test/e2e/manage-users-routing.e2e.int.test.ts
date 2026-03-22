import type { UsersContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22309";

describe("manage-users route ordering e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { UserRepositoryLive } = await import("@/domain/users/repository/user.repository");
      const { UserStatsRepositoryLive } = await import("@/domain/users/repository/user-stats.repository");
      const { UserServiceLive } = await import("@/domain/users/services/user.service");
      const { UserStatsServiceLive } = await import("@/domain/users/services/user-stats.service");

      const userRepoLayer = UserRepositoryLive.pipe(Layer.provide(PrismaLive));
      const userServiceLayer = UserServiceLive.pipe(Layer.provide(userRepoLayer));
      const userStatsServiceLayer = UserStatsServiceLive.pipe(Layer.provide(UserStatsRepositoryLive));

      return Layer.mergeAll(
        userRepoLayer,
        userServiceLayer,
        UserStatsRepositoryLive,
        userStatsServiceLayer,
        PrismaLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: ADMIN_USER_ID,
          fullName: "Route Admin",
          email: "route-admin@example.com",
          passwordHash: "hash123",
          phoneNumber: null,
          username: null,
          avatarUrl: null,
          locationText: null,
          nfcCardUid: null,
          role: "ADMIN",
          accountStatus: "ACTIVE",
          verifyStatus: "VERIFIED",
        },
      });
    },
  });

  it("get /v1/users/manage-users/stats does not get swallowed by {userId}", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });

    const response = await fixture.app.request("http://test/v1/users/manage-users/stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await response.json() as UsersContracts.AdminUserStatsResponse;

    expect(response.status).toBe(200);
    expect(body.totalUsers).toBeTypeOf("number");
  });

  it("get /v1/users/manage-users/dashboard-stats does not get swallowed by {userId}", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });

    const response = await fixture.app.request("http://test/v1/users/manage-users/dashboard-stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await response.json() as UsersContracts.DashboardStatsResponse;

    expect(response.status).toBe(200);
    expect(body.totalCustomers).toBeTypeOf("number");
    expect(body.averageSpending).toBeTypeOf("number");
  });

  it("get /v1/users/manage-users/stats/active-users defaults query when omitted", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });

    const response = await fixture.app.request("http://test/v1/users/manage-users/stats/active-users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await response.json() as UsersContracts.ActiveUsersSeriesResponse;

    expect(response.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("get /v1/users/manage-users/{userId} still resolves detail route", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });

    const response = await fixture.app.request(`http://test/v1/users/manage-users/${ADMIN_USER_ID}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await response.json() as UsersContracts.AdminUserDetailResponse;

    expect(response.status).toBe(200);
    expect(body.id).toBe(ADMIN_USER_ID);
    expect(body.role).toBe("ADMIN");
  });
});
