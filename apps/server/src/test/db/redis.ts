import { GenericContainer, Wait } from "testcontainers";
import process from "node:process";

import logger from "@/lib/logger";

export async function startRedis() {
  const urlFromEnv = process.env.TEST_REDIS_URL;
  if (urlFromEnv) {
    logger.info({ url: urlFromEnv }, "Using TEST_REDIS_URL for integration tests");
    return {
      url: urlFromEnv,
      stop: async () => {},
    };
  }

  logger.info("Starting Redis container...");

  const container = await new GenericContainer("redis:7-alpine")
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
    .start();

  logger.info("Redis container started.");

  const port = container.getMappedPort(6379);
  const host = container.getHost();

  const url = `redis://${host}:${port}`;

  return {
    url,
    stop: async () => {
      logger.info("Stopping Redis container...");
      await container.stop();
      logger.info("Redis container stopped.");
    },
  };
}
