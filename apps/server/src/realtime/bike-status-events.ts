import { sql } from "kysely";
import EventEmitter from "node:events";

import { db } from "@/database";
import logger from "@/lib/logger";

export type BikeStatusUpdatePayload = {
  userId: string;
  bikeId: string;
  status: string;
  rentalId?: string;
  at?: string;
};

type BikeStatusEventName = "bikeStatusUpdate";

const CHANNEL_NAME = "bike_status_updates";
const eventBus = new EventEmitter();

export function getBikeStatusEventBus() {
  return eventBus;
}

export function emitBikeStatusUpdate(payload: BikeStatusUpdatePayload) {
  eventBus.emit("bikeStatusUpdate" satisfies BikeStatusEventName, payload);
}

export async function notifyBikeStatusUpdate(payload: BikeStatusUpdatePayload) {
  const message = JSON.stringify(payload);
  try {
    await sql`select pg_notify(${CHANNEL_NAME}, ${message})`.execute(db);
  }
  catch (error) {
    logger.error({ error }, "Failed to notify bike status update");
  }
}
