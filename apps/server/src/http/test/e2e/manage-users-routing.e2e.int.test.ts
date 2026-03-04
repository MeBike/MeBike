import type { Kysely } from "kysely";

import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { DB } from "generated/kysely/types";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { seed } from "@/test/db/seed";
import { getTestDatabase } from "@/test/db/test-database";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22309";

type RuntimeLike = {
  runPromise: <A>(effect: unknown) => Promise<A>;
  dispose?: () => Promise<void>;
};

type TestAppLike = {
  request: (input: string | URL | Request, init?: RequestInit) => Response | Promise<Response>;
};

describe("manage-users route ordering e2e", () => {
  let container: { stop: () => Promise<void>; url: string };
  let testDb: Kysely<DB>;
  let app: TestAppLike;
  let runtime: RuntimeLike;

  beforeAll(async () => {
    container = await getTestDatabase();
    testDb = makeTestDb(container.url);
    await seed(testDb);

    await testDb
      .insertInto("User")
      .values({
        id: ADMIN_USER_ID,
        fullname: "Route Admin",
        email: "route-admin@example.com",
        password_hash: "hash123",
        phone_number: null,
        username: null,
        avatar: null,
        location: null,
        nfc_card_uid: null,
        role: "ADMIN",
        verify: "VERIFIED",
        updated_at: new Date("2024-01-10T10:00:00Z"),
      })
      .execute();

    process.env.DATABASE_URL = container.url;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "secret";

    vi.resetModules();

    const { Layer, ManagedRuntime } = await import("effect");
    const { createHttpApp } = await import("@/http/app");
    const { PrismaLive } = await import("@/infrastructure/prisma");
    const { UserRepositoryLive } = await import("@/domain/users/repository/user.repository");
    const { UserStatsRepositoryLive } = await import("@/domain/users/repository/user-stats.repository");
    const { UserServiceLive } = await import("@/domain/users/services/user.service");
    const { UserStatsServiceLive } = await import("@/domain/users/services/user-stats.service");

    const userRepoLayer = UserRepositoryLive.pipe(Layer.provide(PrismaLive));
    const userServiceLayer = UserServiceLive.pipe(Layer.provide(userRepoLayer));
    const userStatsServiceLayer = UserStatsServiceLive.pipe(Layer.provide(UserStatsRepositoryLive));
    const httpTestLayer = Layer.mergeAll(
      userRepoLayer,
      userServiceLayer,
      UserStatsRepositoryLive,
      userStatsServiceLayer,
      PrismaLive,
    );

    runtime = ManagedRuntime.make(httpTestLayer) as RuntimeLike;

    app = createHttpApp({
      runPromise: runtime.runPromise as never,
    });
  }, 60000);

  afterAll(async () => {
    const databaseModule = await import("@/database");

    await databaseModule.db.destroy();

    if (runtime?.dispose) {
      await runtime.dispose();
    }
    if (testDb) {
      await destroyTestDb(testDb);
    }
    if (container) {
      await container.stop();
    }
  });

  function makeAccessToken(userId: string) {
    return jwt.sign(
      {
        userId,
        role: "ADMIN",
        verifyStatus: "VERIFIED",
        tokenType: "access",
      },
      process.env.JWT_SECRET ?? "secret",
      { algorithm: "HS256", expiresIn: "10m" },
    );
  }

  it("GET /v1/users/manage-users/stats does not get swallowed by {userId}", async () => {
    const token = makeAccessToken(ADMIN_USER_ID);

    const response = await app.request("http://test/v1/users/manage-users/stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.totalUsers).toBeTypeOf("number");
    expect(body.error).toBeUndefined();
  });

  it("GET /v1/users/manage-users/dashboard-stats does not get swallowed by {userId}", async () => {
    const token = makeAccessToken(ADMIN_USER_ID);

    const response = await app.request("http://test/v1/users/manage-users/dashboard-stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.totalCustomers).toBeTypeOf("number");
    expect(body.averageSpending).toBeTypeOf("number");
    expect(body.error).toBeUndefined();
  });

  it("GET /v1/users/manage-users/{userId} still resolves detail route", async () => {
    const token = makeAccessToken(ADMIN_USER_ID);

    const response = await app.request(`http://test/v1/users/manage-users/${ADMIN_USER_ID}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.id).toBe(ADMIN_USER_ID);
    expect(body.role).toBe("ADMIN");
  });
});
