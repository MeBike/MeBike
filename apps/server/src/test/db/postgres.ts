import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GenericContainer, Wait } from "testcontainers";

import logger from "@/lib/logger";

export async function startPostgres() {
  // Build from the project root's dockerfile context (apps/server)
  // We assume the test process runs from apps/server
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const buildContext = resolve(currentDir, "../../..");

  // GenericContainer.fromDockerfile is async and returns a builder
  const containerBuilder = await GenericContainer.fromDockerfile(buildContext, "infra/postgres/Dockerfile.pg");

  // Build the image
  const image = await containerBuilder.build();
  logger.info("Image built. Starting container...");

  // Start the container
  const runningContainer = await image
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_USER: "mebike",
      POSTGRES_PASSWORD: "mebike",
      POSTGRES_DB: "mebike_test",
    })
    .withWaitStrategy(Wait.forListeningPorts())
    .start();

  logger.info("Container started.");
  // console.log("Running container keys:", Object.keys(runningContainer));

  const port = runningContainer.getMappedPort(5432);
  const host = runningContainer.getHost();

  const url = `postgresql://mebike:mebike@${host}:${port}/mebike_test`;

  return {
    url,
    stop: async () => {
      logger.info("Stopping container...");
      await runningContainer.stop();
      logger.info("Container stopped.");
    },
  };
}
