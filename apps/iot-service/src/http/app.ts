import { OpenAPIHono } from "@hono/zod-openapi";
import { iotServiceOpenApi } from "@mebike/shared";
import { Scalar } from "@scalar/hono-api-reference";

import type { CommandPublisher } from "../publishers";
import type { DeviceManager } from "../services";

import { registerCommandRoutes } from "./routes/commands";
import { registerDeviceRoutes } from "./routes/devices";

export type HttpAppDependencies = {
  commandPublisher: CommandPublisher;
  deviceManager: DeviceManager;
};

export function createHttpApp({ commandPublisher, deviceManager }: HttpAppDependencies) {
  const app = new OpenAPIHono();

  app.doc("/docs/openapi.json", iotServiceOpenApi);
  app.get(
    "/docs",
    Scalar({
      title: "IoT Service API Reference",
      url: "/docs/openapi.json",
    }),
  );

  registerDeviceRoutes(app, { deviceManager });
  registerCommandRoutes(app, { commandPublisher });

  return app;
}
