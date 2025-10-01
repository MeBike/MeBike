import {
  IotMaintenanceStatusMessageSchema,
} from "@mebike/shared";

import { eventBus, EVENTS } from "../events";
import { extractDeviceId } from "../utils/topic";

export function handleMaintenanceStatusMessage(topic: string, payload: string): void {
  const parsed = IotMaintenanceStatusMessageSchema.safeParse(payload);
  if (parsed.success) {
    console.warn(`[maintenance] ${topic}: ${parsed.data}`);

    eventBus.emit(EVENTS.MAINTENANCE_STATUS_UPDATED, {
      deviceId: extractDeviceId(topic),
      status: parsed.data,
      timestamp: new Date(),
    });
  }
  else {
    console.warn(`[maintenance] ${topic}: ${payload} (unexpected format)`);
  }
}
