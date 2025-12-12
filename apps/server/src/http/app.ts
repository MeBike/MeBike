import { OpenAPIHono } from "@hono/zod-openapi";
import { serverOpenApi } from "@mebike/shared";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";

import { registerStationRoutes } from "./routes/stations";

export function createHttpApp() {
  const app = new OpenAPIHono();
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

  return app;
}
