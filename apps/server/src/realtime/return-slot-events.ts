import { sql } from "kysely";
import EventEmitter from "node:events";

import { db } from "@/database";
import logger from "@/lib/logger";

export type ReturnSlotExpiredPayload = {
  userId: string;
  rentalId: string;
  returnSlotId: string;
  stationId: string;
  reservedFrom: string;
  expiredAt: string;
  at: string;
};

type ReturnSlotEventName = "returnSlotExpired";

const CHANNEL_NAME = "return_slot_events";
const eventBus = new EventEmitter();

export function getReturnSlotEventBus() {
  return eventBus;
}

export function emitReturnSlotExpired(payload: ReturnSlotExpiredPayload) {
  eventBus.emit("returnSlotExpired" satisfies ReturnSlotEventName, payload);
}

export async function notifyReturnSlotExpired(payload: ReturnSlotExpiredPayload) {
  const message = JSON.stringify(payload);
  try {
    await sql`select pg_notify(${CHANNEL_NAME}, ${message})`.execute(db);
  }
  catch (error) {
    logger.error({ error }, "Failed to notify return slot expiry");
  }
}
