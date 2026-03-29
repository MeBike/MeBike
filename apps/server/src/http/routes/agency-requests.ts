import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  AgencyRequestsAdminController,
  AgencyRequestsMeController,
  AgencyRequestsPublicController,
} from "@/http/controllers/agency-requests";
import {
  requireAdminMiddleware,
  requireAuthMiddleware,
} from "@/http/middlewares/auth";

export function registerAgencyRequestRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const agencyRequests = serverRoutes.agencyRequests;
  const adminListAgencyRequestsRoute = {
    ...agencyRequests.adminList,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminGetAgencyRequestRoute = {
    ...agencyRequests.adminGet,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const cancelAgencyRequestRoute = {
    ...agencyRequests.cancel,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminListAgencyRequestsRoute, AgencyRequestsAdminController.listAgencyRequests);
  app.openapi(adminGetAgencyRequestRoute, AgencyRequestsAdminController.getAgencyRequestById);
  app.openapi(agencyRequests.submit, AgencyRequestsPublicController.submit);
  app.openapi(cancelAgencyRequestRoute, AgencyRequestsMeController.cancelAgencyRequest);
}
