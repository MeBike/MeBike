import type { StatsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22310";
const USER_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22311";

describe("stats summary e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { UserRepositoryLive } = await import("@/domain/users/repository/user.repository");
      const { UserServiceLive } = await import("@/domain/users/services/user.service");

      const userRepoLayer = UserRepositoryLive.pipe(Layer.provide(PrismaLive));
      const userServiceLayer = UserServiceLive.pipe(Layer.provide(userRepoLayer));

      return Layer.mergeAll(
        userRepoLayer,
        userServiceLayer,
        PrismaLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.createMany({
        data: [
          {
            id: ADMIN_USER_ID,
            fullname: "Stats Admin",
            email: "stats-admin@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatar: null,
            location: null,
            nfcCardUid: null,
            role: "ADMIN",
            verify: "VERIFIED",
          },
          {
            id: USER_USER_ID,
            fullname: "Stats User",
            email: "stats-user@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatar: null,
            location: null,
            nfcCardUid: null,
            role: "USER",
            verify: "VERIFIED",
          },
        ],
      });
    },
  });

  it("admin can read /v1/stats/summary", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });

    const response = await fixture.app.request("http://test/v1/stats/summary", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as StatsContracts.StatsSummaryResponse;

    expect(response.status).toBe(200);
    expect(body.totalStations).toBeTypeOf("number");
    expect(body.totalBikes).toBeTypeOf("number");
    expect(body.totalUsers).toBeTypeOf("number");
  });

  it("non-admin gets 403 for /v1/stats/summary", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_USER_ID, role: "USER" });

    const response = await fixture.app.request("http://test/v1/stats/summary", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it("anonymous gets 401 for /v1/stats/summary", async () => {
    const response = await fixture.app.request("http://test/v1/stats/summary", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });
});
