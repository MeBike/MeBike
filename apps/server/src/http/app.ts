import { OpenAPIHono } from "@hono/zod-openapi";
import { serverOpenApi } from "@mebike/shared";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";

import { registerBikeRoutes } from "./routes/bikes";
import { registerStationRoutes } from "./routes/stations";
import { registerSupplierRoutes } from "./routes/suppliers";

export function createHttpApp() {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (result.success) {
        return;
      }

      const issues = result.error.issues.map((issue) => {
        const path = Array.isArray(issue.path) && issue.path.length
          ? issue.path.join(".")
          : "body";
        return {
          path,
          message: issue.message,
          code: issue.code,
          expected: (issue as any).expected,
          received: (issue as any).received,
        };
      });

      return c.json(
        {
          error: "Invalid request payload",
          details: {
            code: "VALIDATION_ERROR",
            ...(issues.length ? { issues } : {}),
          },
        },
        400,
      );
    },
  });
  app.use("*", cors());
  app.doc("/docs/openapi.json", serverOpenApi);
  app.get(
    "/docs",
    Scalar({
      title: "Server API Reference",
      url: "/docs/openapi.json",
      layout: "modern",
    }),
  );

  registerStationRoutes(app);
  registerBikeRoutes(app);
  registerSupplierRoutes(app);

  return app;
}
