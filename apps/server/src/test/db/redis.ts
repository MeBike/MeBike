import { GenericContainer, Wait } from "testcontainers";

import logger from "@/lib/logger";

export async function startRedis() {
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
