import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { GenericContainer, Wait } from "testcontainers";

import logger from "@/lib/logger";

export async function startPostgres() {
  const urlFromEnv = process.env.TEST_DATABASE_URL;
  if (urlFromEnv) {
    logger.info({ url: urlFromEnv }, "Using TEST_DATABASE_URL for integration tests");
    return {
      url: urlFromEnv,
      stop: async () => {},
    };
  }

  const currentDir = dirname(fileURLToPath(import.meta.url));
  const buildContext = resolve(currentDir, "../../..");

  try {
    const containerBuilder = await GenericContainer.fromDockerfile(buildContext, "infra/postgres/Dockerfile.pg");

    const image = await containerBuilder.build();
    logger.info("Image built. Starting container...");

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
  catch (error) {
    logger.error(
      { error },
      "Failed to start Postgres test container; set TEST_DATABASE_URL to use an existing Postgres instead",
    );
    throw error;
  }
}
