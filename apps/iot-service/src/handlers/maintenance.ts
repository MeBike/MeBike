import {
  IotMaintenanceStatusMessageSchema,
} from "@mebike/shared";

import { eventBus, EVENTS } from "../events";
import logger from "../lib/logger";
import { extractDeviceId } from "../utils/topic";

export function handleMaintenanceStatusMessage(topic: string, payload: string): void {
  const parsed = IotMaintenanceStatusMessageSchema.safeParse(payload);
  if (parsed.success) {
    logger.info({ topic, status: parsed.data }, "maintenance status parsed");

    eventBus.emit(EVENTS.MAINTENANCE_STATUS_UPDATED, {
      deviceId: extractDeviceId(topic),
      status: parsed.data,
      timestamp: new Date(),
    });
  }
  else {
    logger.warn({ topic, payload }, "maintenance status unparsed");
  }
}
