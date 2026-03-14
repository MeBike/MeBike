import { serverRoutes } from "@mebike/shared";

import { StatsController } from "@/http/controllers/stats";

export function registerStatsRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const stats = serverRoutes.stats;
  app.openapi(stats.getSummary, StatsController.getSummary);
}
