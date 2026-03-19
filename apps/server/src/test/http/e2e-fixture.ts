import type { Kysely } from "kysely";

import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { afterAll, beforeAll, vi } from "vitest";

import type { DB } from "generated/kysely/types";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { seed } from "@/test/db/seed";
import { getTestDatabase } from "@/test/db/test-database";
import { createBikeFactory } from "@/test/factories/bike.factory";
import { createRentalFactory } from "@/test/factories/rental.factory";
import { createStationFactory } from "@/test/factories/station.factory";
import { createUserFactory } from "@/test/factories/user.factory";
import { createWalletFactory } from "@/test/factories/wallet.factory";
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
  let factories: {
    user: ReturnType<typeof createUserFactory>;
    station: ReturnType<typeof createStationFactory>;
    bike: ReturnType<typeof createBikeFactory>;
    rental: ReturnType<typeof createRentalFactory>;
    wallet: ReturnType<typeof createWalletFactory>;
  };

  beforeAll(async () => {
    container = await getTestDatabase();
    testDb = makeTestDb(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    prisma = new PrismaClient({ adapter });

    if (options.seedBase ?? true) {
      await seed(testDb);
    }

    if (options.seedData) {
      await options.seedData(testDb, prisma);
    }

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

    factories = {
      user: createUserFactory({ prisma }),
      station: createStationFactory({ prisma }),
      bike: createBikeFactory({ prisma }),
      rental: createRentalFactory({ prisma }),
      wallet: createWalletFactory({ prisma }),
    };
  }, 60000);

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
