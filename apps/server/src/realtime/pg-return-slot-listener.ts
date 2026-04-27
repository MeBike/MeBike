import { Client } from "pg";

import { env } from "@/config/env";
import logger from "@/lib/logger";

import { emitReturnSlotExpired } from "./return-slot-events";

const CHANNEL_NAME = "return_slot_events";
const RECONNECT_DELAYS_MS = [1000, 5000, 15000];

let client: Client | null = null;
let isStarting = false;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempt = 0;

async function cleanupClient(pgClient: Client | null) {
  if (!pgClient) {
    return;
  }
  try {
    pgClient.removeAllListeners("notification");
    pgClient.removeAllListeners("error");
    pgClient.removeAllListeners("end");
  }
  catch {
    // ignore
  }
  try {
    await pgClient.end();
  }
  catch {
    // ignore
  }
}

function scheduleReconnect(reason: string, error?: unknown) {
  if (reconnectTimeout || isStarting) {
    return;
  }

  if (error) {
    logger.error({ error }, `Return slot listener reconnecting: ${reason}`);
  }
  else {
    logger.warn(`Return slot listener reconnecting: ${reason}`);
  }

  const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
  reconnectAttempt = Math.min(reconnectAttempt + 1, 1000);

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    void startReturnSlotListener();
  }, delay);
}

async function connectListener() {
  const pgClient = new Client({ connectionString: env.DATABASE_URL });
  await pgClient.connect();
  await pgClient.query(`LISTEN ${CHANNEL_NAME}`);

  pgClient.on("notification", (message) => {
    if (message.channel !== CHANNEL_NAME || !message.payload) {
      return;
    }
    try {
      const payload = JSON.parse(message.payload) as Parameters<typeof emitReturnSlotExpired>[0];
      emitReturnSlotExpired(payload);
    }
    catch (error) {
      logger.error({ error }, "Failed to parse return slot notification");
    }
  });

  pgClient.on("error", (error) => {
    logger.error({ error }, "Return slot listener error");
    void cleanupClient(pgClient).then(() => {
      if (client === pgClient) {
        client = null;
      }
      scheduleReconnect("pg error", error);
    });
  });

  pgClient.on("end", () => {
    logger.warn("Return slot listener disconnected");
    void cleanupClient(pgClient).then(() => {
      if (client === pgClient) {
        client = null;
      }
      scheduleReconnect("pg end");
    });
  });

  return pgClient;
}

export async function startReturnSlotListener() {
  if (client || isStarting) {
    return;
  }
  isStarting = true;
  try {
    client = await connectListener();
    logger.info(`Listening for return slot updates on ${CHANNEL_NAME}`);
    reconnectAttempt = 0;
  }
  catch (error) {
    logger.error({ error }, "Failed to start return slot listener");
    await cleanupClient(client);
    client = null;
    scheduleReconnect("start failed", error);
  }
  isStarting = false;
}
