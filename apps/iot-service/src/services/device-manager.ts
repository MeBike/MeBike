import { eventBus, EVENTS } from "../events";

export class DeviceManager {
  private deviceStates = new Map<string, string>();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on(EVENTS.DEVICE_STATUS_CHANGED, (data) => {
      if (data.deviceId) {
        this.deviceStates.set(data.deviceId, data.status);
        console.warn(`Device ${data.deviceId} status updated to: ${data.status}`);
      }
    });

    eventBus.on(EVENTS.BOOKING_STATUS_UPDATED, (data) => {
      if (data.deviceId) {
        console.warn(`Device ${data.deviceId} booking status: ${data.status}`);
      }
    });

    eventBus.on(EVENTS.MAINTENANCE_STATUS_UPDATED, (data) => {
      if (data.deviceId) {
        console.warn(`Device ${data.deviceId} maintenance status: ${data.status}`);
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
