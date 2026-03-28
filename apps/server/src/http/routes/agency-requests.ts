import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  AgencyRequestsAdminController,
  AgencyRequestsPublicController,
} from "@/http/controllers/agency-requests";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerAgencyRequestRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const agencyRequests = serverRoutes.agencyRequests;
  const adminListAgencyRequestsRoute = {
    ...agencyRequests.adminList,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminListAgencyRequestsRoute, AgencyRequestsAdminController.listAgencyRequests);
  app.openapi(agencyRequests.submit, AgencyRequestsPublicController.submit);
}
