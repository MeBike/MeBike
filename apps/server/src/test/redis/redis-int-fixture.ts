import Redis from "ioredis";
import { afterAll, afterEach, beforeAll } from "vitest";

import { startRedis } from "@/test/db/redis";

type TestRedisContainer = {
  stop: () => Promise<void>;
  url: string;
};

export function setupRedisIntFixture() {
  let container: TestRedisContainer;
  let client: Redis;

  beforeAll(async () => {
    container = await startRedis();
    client = new Redis(container.url);
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
