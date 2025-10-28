import { eventBus, EVENTS } from "../events";
import logger from "../lib/logger";

export class DeviceManager {
  private deviceStates = new Map<string, string>();
  private deviceLastSeen = new Map<string, number>();
  private readonly deviceTtlMs: number;
  private readonly cleanupIntervalMs: number;
  private cleanupTimer: NodeJS.Timeout | undefined;

  constructor(deviceTtlMs: number = 5 * 60 * 1000, cleanupIntervalMs: number = 60 * 1000) {
    this.deviceTtlMs = deviceTtlMs;
    this.cleanupIntervalMs = cleanupIntervalMs;
    this.setupEventListeners();
    this.startCleanupTimer();
  }

  private setupEventListeners(): void {
    eventBus.on(EVENTS.DEVICE_STATUS_CHANGED, (data) => {
      if (data.deviceId) {
        const now = Date.now();
        this.deviceStates.set(data.deviceId, data.status);
        this.deviceLastSeen.set(data.deviceId, now);
        logger.info({ deviceId: data.deviceId, status: data.status }, "device status updated");
      }
    });

    eventBus.on(EVENTS.BOOKING_STATUS_UPDATED, (data) => {
      if (data.deviceId) {
        this.deviceLastSeen.set(data.deviceId, Date.now());
        logger.info({ deviceId: data.deviceId, status: data.status }, "device booking status");
      }
    });

    eventBus.on(EVENTS.MAINTENANCE_STATUS_UPDATED, (data) => {
      if (data.deviceId) {
        this.deviceLastSeen.set(data.deviceId, Date.now());
        logger.info({ deviceId: data.deviceId, status: data.status }, "device maintenance status");
      }
    });
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleDevices();
    }, this.cleanupIntervalMs);

    logger.info(
      { deviceTtlMs: this.deviceTtlMs, cleanupIntervalMs: this.cleanupIntervalMs },
      "Device eviction timer started",
    );
  }

  private cleanupStaleDevices(): void {
    const now = Date.now();
    const staleDevices: string[] = [];

    for (const [deviceId, lastSeen] of this.deviceLastSeen.entries()) {
      if (now - lastSeen > this.deviceTtlMs) {
        staleDevices.push(deviceId);
      }
    }

    for (const deviceId of staleDevices) {
      this.deviceStates.delete(deviceId);
      this.deviceLastSeen.delete(deviceId);
      logger.warn({ deviceId }, "Device evicted due to inactivity");
    }

    if (staleDevices.length > 0) {
      logger.info(
        { evictedCount: staleDevices.length, remainingDevices: this.deviceLastSeen.size },
        "Stale device cleanup completed",
      );
    }
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      logger.info("Device eviction timer stopped");
    }
  }

  public forceCleanup(): void {
    this.cleanupStaleDevices();
  }

  public getDeviceCount(): number {
    return this.deviceLastSeen.size;
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
