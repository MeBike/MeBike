import { sql } from "kysely";
import EventEmitter from "node:events";

import type { DeviceDenyReason } from "@/domain/iot";

import { db } from "@/database";
import logger from "@/lib/logger";

export type NfcCardSwipeFailedReason = Extract<
  DeviceDenyReason,
  | "ACTIVE_RENTAL_EXISTS"
  | "ACTIVE_RESERVATION_EXISTS"
  | "BIKE_RESERVED"
  | "INSUFFICIENT_FUNDS"
  | "OVERNIGHT_OPERATIONS_CLOSED"
>;

export type NfcCardSwipeFailedPayload = {
  userId: string;
  requestId: string;
  bikeId: string;
  reason: NfcCardSwipeFailedReason;
  at: string;
};

type NfcCardEventName = "nfcCardSwipeFailed";

const CHANNEL_NAME = "nfc_card_events";
const eventBus = new EventEmitter();

export function getNfcCardEventBus() {
  return eventBus;
}

export function emitNfcCardSwipeFailed(payload: NfcCardSwipeFailedPayload) {
  eventBus.emit("nfcCardSwipeFailed" satisfies NfcCardEventName, payload);
}

export async function notifyNfcCardSwipeFailed(payload: NfcCardSwipeFailedPayload) {
  const message = JSON.stringify(payload);
  try {
    await sql`select pg_notify(${CHANNEL_NAME}, ${message})`.execute(db);
  }
  catch (error) {
    logger.error({ error }, "Failed to notify NFC card swipe failure");
  }
}
