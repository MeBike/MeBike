import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { OperatorController } from "@/http/controllers/operators.controller";
import { requireStaffOrManagerOrAgencyMiddleware } from "@/http/middlewares/auth";

export function registerOperatorRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const operators = serverRoutes.operators;

  const stationContextRoute = {
    ...operators.stationContext,
    middleware: [requireStaffOrManagerOrAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(stationContextRoute, OperatorController.getStationContext);
}
