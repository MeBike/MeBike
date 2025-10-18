import process from "node:process";

import type { IotApplication } from "./index";

import logger from "../lib/logger";

export function setupLifecycleManagement(app: IotApplication): void {
  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.warn("Received shutdown signal");

    try {
      await app.stop();
      logger.info("Application shutdown complete");
      process.exit(0);
    }
    catch (error) {
      logger.error({ err: error }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.on("uncaughtException", (error) => {
    logger.error({ err: error }, "Uncaught exception");
    shutdown();
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error({ reason, promise }, "Unhandled rejection");
    shutdown();
  });
}
