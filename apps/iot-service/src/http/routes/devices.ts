import type { OpenAPIHono } from "@hono/zod-openapi";
import type { DeviceStatus, ErrorResponse } from "@mebike/shared";

import {
  iotServiceRoutes,
  normalizeMac,
} from "@mebike/shared";
import process from "node:process";

import type { DeviceManager } from "../../services";

export type RegisterDeviceRoutesOptions = {
  deviceManager: DeviceManager;
};

export function registerDeviceRoutes(
  app: OpenAPIHono,
  { deviceManager }: RegisterDeviceRoutesOptions,
): void {
  app.openapi(iotServiceRoutes.health, (c) => {
    return c.json({
      status: "ok",
      uptimeMs: Math.round(process.uptime() * 1000),
      timestamp: new Date().toISOString(),
    });
  });

  app.openapi(iotServiceRoutes.listDevices, (c) => {
    const items = Array.from(deviceManager.getAllDeviceStates().entries()).map(([
      deviceId,
      status,
    ]) => ({ deviceId, status }));

    return c.json({ items });
  });

  app.openapi(iotServiceRoutes.getDevice, (c) => {
    const { deviceId } = c.req.valid("param");
    const normalized = normalizeMac(deviceId);

    if (!normalized) {
      return c.json<ErrorResponse, 400>({
        error: "Invalid device identifier",
        details: { deviceId },
      }, 400);
    }

    const status = deviceManager.getDeviceState(normalized);
    if (!status) {
      return c.json<ErrorResponse, 404>({
        error: "Device not found",
        details: { deviceId: normalized },
      }, 404);
    }

    return c.json<DeviceStatus, 200>({ deviceId: normalized, status }, 200);
  });
}
