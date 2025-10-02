import type { DeviceManager } from "../services";

import { eventBus, EVENTS } from "../events";

export class DeviceDiscovery {
  constructor(private deviceManager: DeviceManager) {}

  start(): void {
    console.warn("Starting device discovery...");

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

    console.warn("Device discovery started");
  }

  private handleDeviceStatusChange(deviceId: string | undefined, status: string): void {
    if (!deviceId) {
      return;
    }

    console.warn(`Device discovery: ${deviceId} status changed to ${status}`);
  }

  private handleDeviceActivity(deviceId: string | undefined, activity: string): void {
    if (!deviceId) {
      return;
    }

    console.warn(`Device discovery: ${deviceId} active (${activity})`);
  }
}
