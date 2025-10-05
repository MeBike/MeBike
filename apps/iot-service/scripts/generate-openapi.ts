import { OpenAPIHono } from "@hono/zod-openapi";
import { IotService } from "@mebike/shared";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { CommandPublisher } from "../src/publishers";
import type { DeviceManager } from "../src/services";

import { registerCommandRoutes } from "../src/http/routes/commands";
import { registerDeviceRoutes } from "../src/http/routes/devices";

async function noopAsync() {}

const commandPublisherStub = {
  sendStateCommand: noopAsync,
  sendBookingCommand: noopAsync,
  sendReservationCommand: noopAsync,
  sendMaintenanceCommand: noopAsync,
  requestStatus: noopAsync,
} as unknown as CommandPublisher;

const deviceManagerStub = {
  getDeviceState: () => undefined,
  getAllDeviceStates: () => new Map<string, string>(),
  isDeviceAvailable: () => false,
} as unknown as DeviceManager;

const app = new OpenAPIHono();

registerDeviceRoutes(app, { deviceManager: deviceManagerStub });
registerCommandRoutes(app, {
  deviceManager: deviceManagerStub,
  commandPublisher: commandPublisherStub,
});

const openApiDocument = app.getOpenAPIDocument(IotService.iotServiceOpenApi);

const rootDir = dirname(fileURLToPath(import.meta.url));
const outputPath = join(rootDir, "../../../openapi/iot-service.json");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(openApiDocument, null, 2)}\n`, "utf8");

console.warn(`OpenAPI document written to ${outputPath}`);
