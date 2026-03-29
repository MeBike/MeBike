import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { AgencyAdminController } from "@/http/controllers/agencies";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerAgencyRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const agencies = serverRoutes.agencies;
  const adminGetAgencyRoute = {
    ...agencies.adminGet,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminListAgenciesRoute = {
    ...agencies.adminList,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminGetAgencyRoute, AgencyAdminController.getAgencyById);
  app.openapi(adminListAgenciesRoute, AgencyAdminController.listAgencies);
}
