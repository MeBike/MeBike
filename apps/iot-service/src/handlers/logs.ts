import { eventBus, EVENTS } from "../events";
import { extractDeviceId } from "../utils/topic";

export function handleLogMessage(topic: string, payload: string): void {
  console.warn(`[log] ${topic}: ${payload}`);

  eventBus.emit(EVENTS.LOG_RECEIVED, {
    deviceId: extractDeviceId(topic),
    message: payload,
    timestamp: new Date(),
  });
}
