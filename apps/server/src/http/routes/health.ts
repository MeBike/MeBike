import { serverRoutes } from "@mebike/shared";

export function registerHealthRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const health = serverRoutes.health;

  app.openapi(health.health, (c) => {
    return c.json({ status: "ok" }, 200);
  });
}
