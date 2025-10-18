import {
  IotStatusMessageSchema,
} from "@mebike/shared";

import { eventBus, EVENTS } from "../events";
import logger from "../lib/logger";
import { extractDeviceId } from "../utils/topic";

export function handleStatusMessage(topic: string, payload: string): void {
  const parsed = IotStatusMessageSchema.safeParse(payload);
  if (parsed.success) {
    logger.info({ topic, status: parsed.data }, "status message parsed");

    eventBus.emit(EVENTS.DEVICE_STATUS_CHANGED, {
      deviceId: extractDeviceId(topic),
      status: parsed.data,
      timestamp: new Date(),
    });
  }
  else {
    logger.warn({ topic, payload }, "status message unparsed");
  }
}
