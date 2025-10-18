import { eventBus, EVENTS } from "../events";
import logger from "../lib/logger";

export class DeviceManager {
  private deviceStates = new Map<string, string>();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on(EVENTS.DEVICE_STATUS_CHANGED, (data) => {
      if (data.deviceId) {
        this.deviceStates.set(data.deviceId, data.status);
        logger.info({ deviceId: data.deviceId, status: data.status }, "device status updated");
      }
    });

    eventBus.on(EVENTS.BOOKING_STATUS_UPDATED, (data) => {
      if (data.deviceId) {
        logger.info({ deviceId: data.deviceId, status: data.status }, "device booking status");
      }
    });

    eventBus.on(EVENTS.MAINTENANCE_STATUS_UPDATED, (data) => {
      if (data.deviceId) {
        logger.info({ deviceId: data.deviceId, status: data.status }, "device maintenance status");
      }
    });
  }

  getDeviceState(deviceId: string): string | undefined {
    return this.deviceStates.get(deviceId);
  }

  getAllDeviceStates(): Map<string, string> {
    return new Map(this.deviceStates);
  }

  isDeviceAvailable(deviceId: string): boolean {
    return this.deviceStates.get(deviceId) === "available";
  }
}
