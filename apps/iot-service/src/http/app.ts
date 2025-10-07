import type { ZodIssue } from "zod";

import { OpenAPIHono } from "@hono/zod-openapi";
import { iotServiceOpenApi } from "@mebike/shared";
import { Scalar } from "@scalar/hono-api-reference";

import type { CommandPublisher } from "../publishers";
import type { DeviceManager } from "../services";

import { errorHandler } from "../middleware";
import { registerCommandRoutes } from "./routes/commands";
import { registerDeviceRoutes } from "./routes/devices";

export type HttpAppDependencies = {
  commandPublisher: CommandPublisher;
  deviceManager: DeviceManager;
};

export function createHttpApp({ commandPublisher, deviceManager }: HttpAppDependencies) {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (result.success) {
        return;
      }

      const issues = result.error.issues.map((issue: ZodIssue) => {
        const path = issue.path.length ? issue.path.join(".") : "body";
        return {
          path,
          message: issue.message,
          code: issue.code,
          expected: (issue as any).expected,
          received: (issue as any).received,
        };
      });

      return c.json({
        error: "Invalid command payload",
        details: {
          code: "VALIDATION_ERROR",
          ...(issues.length ? { issues } : {}),
        },
      }, 400);
    },
  });

  app.use("*", errorHandler());

  app.doc("/docs/openapi.json", iotServiceOpenApi);
  app.get(
    "/docs",
    Scalar({
      title: "IoT Service API Reference",
      url: "/docs/openapi.json",
      layout: "modern",
    }),
  );

  registerDeviceRoutes(app, { deviceManager });
  registerCommandRoutes(app, { commandPublisher, deviceManager });

  return app;
}
