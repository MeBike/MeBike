import type { StatsContracts } from "@mebike/shared";
import type { Kysely } from "kysely";

import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { DB } from "generated/kysely/types";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { seed } from "@/test/db/seed";
import { getTestDatabase } from "@/test/db/test-database";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22310";
const USER_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22311";

type RuntimeLike = {
  runPromise: <A>(effect: unknown) => Promise<A>;
  dispose?: () => Promise<void>;
};

type TestAppLike = {
  request: (input: string | URL | Request, init?: RequestInit) => Response | Promise<Response>;
};

describe("stats summary e2e", () => {
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
      .values([
        {
          id: ADMIN_USER_ID,
          fullname: "Stats Admin",
          email: "stats-admin@example.com",
          password_hash: "hash123",
          phone_number: null,
          username: null,
          avatar: null,
          location: null,
          nfc_card_uid: null,
          role: "ADMIN",
          verify: "VERIFIED",
          updated_at: new Date("2024-01-10T10:00:00Z"),
        },
        {
          id: USER_USER_ID,
          fullname: "Stats User",
          email: "stats-user@example.com",
          password_hash: "hash123",
          phone_number: null,
          username: null,
          avatar: null,
          location: null,
          nfc_card_uid: null,
          role: "USER",
          verify: "VERIFIED",
          updated_at: new Date("2024-01-11T10:00:00Z"),
        },
      ])
      .execute();

    process.env.DATABASE_URL = container.url;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "secret";

    vi.resetModules();

    const { Layer, ManagedRuntime } = await import("effect");
    const { createHttpApp } = await import("@/http/app");
    const { PrismaLive } = await import("@/infrastructure/prisma");
    const { UserRepositoryLive } = await import("@/domain/users/repository/user.repository");
    const { UserServiceLive } = await import("@/domain/users/services/user.service");

    const userRepoLayer = UserRepositoryLive.pipe(Layer.provide(PrismaLive));
    const userServiceLayer = UserServiceLive.pipe(Layer.provide(userRepoLayer));

    const httpTestLayer = Layer.mergeAll(
      userRepoLayer,
      userServiceLayer,
      PrismaLive,
    );

    runtime = ManagedRuntime.make(httpTestLayer) as RuntimeLike;

    app = createHttpApp({
      runPromise: runtime.runPromise as never,
    });
  }, 60000);

  afterAll(async () => {
    if (runtime?.dispose) {
      await runtime.dispose();
    }

    const databaseModule = await import("@/database");
    await databaseModule.db.destroy();

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
        tokenType: "access",
      },
      process.env.JWT_SECRET ?? "secret",
      { algorithm: "HS256", expiresIn: "10m" },
    );
  }

  it("admin can read /v1/stats/summary", async () => {
    const token = makeAccessToken(ADMIN_USER_ID);

    const response = await app.request("http://test/v1/stats/summary", {
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
    const token = makeAccessToken(USER_USER_ID);

    const response = await app.request("http://test/v1/stats/summary", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it("anonymous gets 401 for /v1/stats/summary", async () => {
    const response = await app.request("http://test/v1/stats/summary", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });
});
