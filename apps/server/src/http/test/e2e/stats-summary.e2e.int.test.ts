import type { StatsContracts } from "@mebike/shared";
import type { Kysely } from "kysely";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { DB } from "generated/kysely/types";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { seed } from "@/test/db/seed";
import { getTestDatabase } from "@/test/db/test-database";


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

  it("anonymous can read /v1/stats/summary", async () => {
    const response = await app.request("http://test/v1/stats/summary", {
      method: "GET",
    });

    const body = await response.json() as StatsContracts.StatsSummaryResponse;
    expect(response.status).toBe(200);
    expect(body.totalStations).toBeTypeOf("number");
    expect(body.totalBikes).toBeTypeOf("number");
    expect(body.totalUsers).toBeTypeOf("number");
  });
});
