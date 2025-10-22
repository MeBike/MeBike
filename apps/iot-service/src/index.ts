import process from "node:process";

import { bootstrap } from "./bootstrap";
import { env } from "./config";
import logger from "./lib/logger";

async function main() {
  try {
    const app = await bootstrap();

    const config = {
      mqtt: {
        brokerUrl: env.MQTT_URL,
        username: env.MQTT_USERNAME,
        password: env.MQTT_PASSWORD,
        retryAttempts: env.MQTT_CONNECTION_RETRY_ATTEMPTS,
        retryDelayMs: env.MQTT_CONNECTION_RETRY_DELAY_MS,
      },
      http: {
        port: env.HTTP_PORT,
        hostname: env.HTTP_HOST,
      },
      deviceMac: env.DEVICE_MAC,
      stateMachine: {
        stepDelayMs: Number.parseInt(env.STATE_STEP_DELAY_MS, 10),
        transitionTimeoutMs: Number.parseInt(env.STATE_TIMEOUT_MS, 10),
      },
    };

    await app.start(config);

    const shutdown = async () => {
      logger.warn("Received shutdown signal, stopping application...");
      await app.stop();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
  catch (error) {
    logger.error({ err: error }, "Application failed to start");
    process.exit(1);
  }
}

main();
