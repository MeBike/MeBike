import Redis from "ioredis";
import process from "node:process";
import { afterAll, afterEach, beforeAll } from "vitest";

import { startRedis } from "@/test/db/redis";

type TestRedisContainer = {
  stop: () => Promise<void>;
  url: string;
};

function getVitestRedisDbIndex() {
  const rawWorkerId = process.env.VITEST_WORKER_ID ?? process.env.VITEST_POOL_ID ?? "1";
  const workerId = Number.parseInt(rawWorkerId, 10);

  if (!Number.isFinite(workerId) || workerId <= 0) {
    return 0;
  }

  // Redis defaults to 16 logical DBs. CI uses a shared Redis service, so each
  // Vitest worker gets a DB to stop one file's flushdb from deleting another
  // file's auth sessions mid-test.
  return (workerId - 1) % 16;
}

export function setupRedisIntFixture() {
  let container: TestRedisContainer;
  let client: Redis;

  beforeAll(async () => {
    container = await startRedis();
    client = new Redis(container.url, { db: getVitestRedisDbIndex() });
  }, 60000);

  afterEach(async () => {
    if (client) {
      await client.flushdb();
    }
  });

  afterAll(async () => {
    if (client) {
      await client.quit();
    }

    if (container) {
      await container.stop();
    }
  });

  return {
    get client() {
      return client;
    },
    get container() {
      return container;
    },
  };
}
