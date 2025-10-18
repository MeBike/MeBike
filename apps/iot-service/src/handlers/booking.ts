import {
  IotBookingStatusMessageSchema,
} from "@mebike/shared";

import { eventBus, EVENTS } from "../events";
import logger from "../lib/logger";
import { extractDeviceId } from "../utils/topic";

export function handleBookingStatusMessage(topic: string, payload: string): void {
  const parsed = IotBookingStatusMessageSchema.safeParse(payload);
  if (parsed.success) {
    logger.info({ topic, status: parsed.data }, "booking status parsed");

    eventBus.emit(EVENTS.BOOKING_STATUS_UPDATED, {
      deviceId: extractDeviceId(topic),
      status: parsed.data,
      timestamp: new Date(),
    });
  }
  else {
    logger.warn({ topic, payload }, "booking status unparsed");
  }
}
