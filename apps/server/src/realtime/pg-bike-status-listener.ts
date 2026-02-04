import { Client } from "pg";

import { env } from "@/config/env";
import logger from "@/lib/logger";

import { emitBikeStatusUpdate } from "./bike-status-events";

const CHANNEL_NAME = "bike_status_updates";
let client: Client | null = null;
let isStarting = false;

async function connectListener() {
  const pgClient = new Client({ connectionString: env.DATABASE_URL });
  await pgClient.connect();
  await pgClient.query(`LISTEN ${CHANNEL_NAME}`);

  pgClient.on("notification", (message) => {
    if (message.channel !== CHANNEL_NAME || !message.payload) {
      return;
    }
    try {
      const payload = JSON.parse(message.payload) as Parameters<typeof emitBikeStatusUpdate>[0];
      emitBikeStatusUpdate(payload);
    }
    catch (error) {
      logger.error({ error }, "Failed to parse bike status notification");
    }
  });

  pgClient.on("error", (error) => {
    logger.error({ error }, "Bike status listener error");
  });

  pgClient.on("end", () => {
    logger.warn("Bike status listener disconnected");
  });

  return pgClient;
}

export async function startBikeStatusListener() {
  if (client || isStarting) {
    return;
  }
  isStarting = true;
  try {
    client = await connectListener();
    logger.info(`Listening for bike status updates on ${CHANNEL_NAME}`);
  }
  catch (error) {
    logger.error({ error }, "Failed to start bike status listener");
    client = null;
    setTimeout(() => {
      isStarting = false;
      void startBikeStatusListener();
    }, 5000);
    return;
  }
  isStarting = false;
}
