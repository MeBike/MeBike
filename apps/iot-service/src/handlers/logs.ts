import { eventBus, EVENTS } from "../events";
import logger from "../lib/logger";
import { extractDeviceId } from "../utils/topic";

export function handleLogMessage(topic: string, payload: string): void {
  logger.warn({ topic, payload }, "log message received");

  eventBus.emit(EVENTS.LOG_RECEIVED, {
    deviceId: extractDeviceId(topic),
    message: payload,
    timestamp: new Date(),
  });
}
