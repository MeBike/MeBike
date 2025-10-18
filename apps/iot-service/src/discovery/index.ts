import type { DeviceManager } from "../services";

import { eventBus, EVENTS } from "../events";
import logger from "../lib/logger";

export class DeviceDiscovery {
  constructor(private deviceManager: DeviceManager) {}

  start(): void {
    logger.info("Starting device discovery...");

    //  status changes
    eventBus.on(EVENTS.DEVICE_STATUS_CHANGED, (data) => {
      this.handleDeviceStatusChange(data.deviceId, data.status);
    });

    //  booking status updates
    eventBus.on(EVENTS.BOOKING_STATUS_UPDATED, (data) => {
      this.handleDeviceActivity(data.deviceId, "booking");
    });

    //  maintenance status updates
    eventBus.on(EVENTS.MAINTENANCE_STATUS_UPDATED, (data) => {
      this.handleDeviceActivity(data.deviceId, "maintenance");
    });

    //  log messages
    eventBus.on(EVENTS.LOG_RECEIVED, (data) => {
      this.handleDeviceActivity(data.deviceId, "logging");
    });

    logger.info("Device discovery started");
  }

  private handleDeviceStatusChange(deviceId: string | undefined, status: string): void {
    if (!deviceId) {
      return;
    }

    logger.info({ deviceId, status }, "device status changed");
  }

  private handleDeviceActivity(deviceId: string | undefined, activity: string): void {
    if (!deviceId) {
      return;
    }

    logger.info({ deviceId, activity }, "device activity");
  }
}
