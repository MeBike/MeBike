import type { Kysely } from "kysely";

import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

import type { TestFactories } from "@/test/factories";
import type { DB } from "generated/kysely/types";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { resetTestData } from "@/test/db/reset";
import { seed } from "@/test/db/seed";
import { getTestDatabase } from "@/test/db/test-database";
import { createTestFactories } from "@/test/factories";
import { makeAccessToken, makeAuthHeader } from "@/test/http/auth";
import { PrismaClient } from "generated/prisma/client";

type RuntimeLike = {
  runPromise: <A>(effect: unknown) => Promise<A>;
  dispose?: () => Promise<void>;
};

type TestAppLike = {
  request: (input: string | URL | Request, init?: RequestInit) => Response | Promise<Response>;
};

type TestContainer = {
  stop: () => Promise<void>;
  url: string;
};

type BuildLayer = () => Promise<any>;

type E2eFixtureOptions = {
  buildLayer: BuildLayer;
  seedBase?: boolean;
  seedData?: (db: Kysely<DB>, prisma: PrismaClient) => Promise<void>;
};

export function setupHttpE2eFixture(options: E2eFixtureOptions) {
  let container: TestContainer;
  let testDb: Kysely<DB>;
  let prisma: PrismaClient;
  let app: TestAppLike;
  let runtime: RuntimeLike;
  let factories: TestFactories;

  beforeAll(async () => {
    container = await getTestDatabase();
    testDb = makeTestDb(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    prisma = new PrismaClient({ adapter });

    process.env.DATABASE_URL = container.url;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "secret";

    vi.resetModules();

    const { ManagedRuntime } = await import("effect");
    const { createHttpApp } = await import("@/http/app");
    const testLayer = await options.buildLayer();

    runtime = ManagedRuntime.make(testLayer) as RuntimeLike;
    app = createHttpApp({
      runPromise: runtime.runPromise as never,
    });

    factories = createTestFactories({ prisma });
  }, 60000);

  beforeEach(async () => {
    await resetTestData(prisma);

    if (options.seedBase ?? true) {
      await seed(testDb);
    }

    if (options.seedData) {
      await options.seedData(testDb, prisma);
    }
  });

  afterEach(async () => {
    await resetTestData(prisma);
  });

  afterAll(async () => {
    if (runtime?.dispose) {
      await runtime.dispose();
    }

    const databaseModule = await import("@/database");
    await databaseModule.db.destroy();

    if (prisma) {
      await prisma.$disconnect();
    }

    if (testDb) {
      await destroyTestDb(testDb);
    }

    if (container) {
      await container.stop();
    }
  });

  return {
    get app() {
      return app;
    },
    get db() {
      return testDb;
    },
    get prisma() {
      return prisma;
    },
    get factories() {
      return factories;
    },
    auth: {
      makeAccessToken,
      makeAuthHeader,
    },
  };
}
