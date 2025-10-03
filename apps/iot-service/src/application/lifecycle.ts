import process from "node:process";

import type { IotApplication } from "./index";

export function setupLifecycleManagement(app: IotApplication): void {
  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.warn("Received shutdown signal");

    try {
      await app.stop();
      console.warn("Application shutdown complete");
      process.exit(0);
    }
    catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    shutdown();
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled rejection at:", promise, "reason:", reason);
    shutdown();
  });
}
