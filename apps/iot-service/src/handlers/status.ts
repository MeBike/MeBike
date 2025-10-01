import {
  IotStatusMessageSchema,
} from "@mebike/shared";

import { eventBus, EVENTS } from "../events";
import { extractDeviceId } from "../utils/topic";

export function handleStatusMessage(topic: string, payload: string): void {
  const parsed = IotStatusMessageSchema.safeParse(payload);
  if (parsed.success) {
    console.warn(`[status] ${topic}: ${parsed.data}`);

    eventBus.emit(EVENTS.DEVICE_STATUS_CHANGED, {
      deviceId: extractDeviceId(topic),
      status: parsed.data,
      timestamp: new Date(),
    });
  }
  else {
    console.warn(`[status] ${topic}: ${payload} (unparsed)`);
  }
}
