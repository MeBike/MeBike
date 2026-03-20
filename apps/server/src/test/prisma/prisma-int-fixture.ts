import type { Kysely } from "kysely";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import type { DB } from "generated/kysely/types";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { resetTestData } from "@/test/db/reset";
import { seed } from "@/test/db/seed";
import { getTestDatabase } from "@/test/db/test-database";
import { createTestFactories } from "@/test/factories";
import { PrismaClient } from "generated/prisma/client";

import type { TestFactories } from "../factories";

type TestContainer = {
  stop: () => Promise<void>;
  url: string;
};

type PrismaIntFixtureContext = {
  db: Kysely<DB>;
  prisma: PrismaClient;
  factories: TestFactories;
};

type PrismaIntFixtureOptions = {
  seedBase?: boolean;
  seedData?: (context: PrismaIntFixtureContext) => Promise<void>;
};

export function setupPrismaIntFixture(options: PrismaIntFixtureOptions = {}) {
  let container: TestContainer;
  let db: Kysely<DB>;
  let prisma: PrismaClient;
  let factories: TestFactories;

  beforeAll(async () => {
    container = await getTestDatabase();
    db = makeTestDb(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    prisma = new PrismaClient({ adapter });

    factories = createTestFactories({ prisma });
  }, 60000);

  beforeEach(async () => {
    await resetTestData(prisma);

    if (options.seedBase) {
      await seed(db);
    }

    if (options.seedData) {
      await options.seedData({ db, prisma, factories });
    }
  });

  afterEach(async () => {
    await resetTestData(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }

    if (db) {
      await destroyTestDb(db);
    }

    if (container) {
      await container.stop();
    }
  });

  return {
    get db() {
      return db;
    },
    get prisma() {
      return prisma;
    },
    get factories() {
      return factories;
    },
  };
}
