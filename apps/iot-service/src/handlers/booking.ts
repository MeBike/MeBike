import {
  IotBookingStatusMessageSchema,
} from "@mebike/shared";

import { eventBus, EVENTS } from "../events";
import { extractDeviceId } from "../utils/topic";

export function handleBookingStatusMessage(topic: string, payload: string): void {
  const parsed = IotBookingStatusMessageSchema.safeParse(payload);
  if (parsed.success) {
    console.warn(`[booking] ${topic}: ${parsed.data}`);

    eventBus.emit(EVENTS.BOOKING_STATUS_UPDATED, {
      deviceId: extractDeviceId(topic),
      status: parsed.data,
      timestamp: new Date(),
    });
  }
  else {
    console.warn(`[booking] ${topic}: ${payload} (unexpected format)`);
  }
}
