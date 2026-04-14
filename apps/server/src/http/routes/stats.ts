import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { StatsController } from "@/http/controllers/stats";

export function registerStatsRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const stats = serverRoutes.stats;

  const getSummaryRoute = {
    ...stats.getSummary,
  } satisfies RouteConfig;

  app.openapi(getSummaryRoute, StatsController.getSummary);
}
