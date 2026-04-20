import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { OperatorController } from "@/http/controllers/operators.controller";
import { requireStaffOrManagerMiddleware } from "@/http/middlewares/auth";

export function registerOperatorRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const operators = serverRoutes.operators;

  const stationContextRoute = {
    ...operators.stationContext,
    middleware: [requireStaffOrManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(stationContextRoute, OperatorController.getStationContext);
}
