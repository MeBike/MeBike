import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  RedistributionAdminController,
  RedistributionMeController,
  RedistributionStaffController,
} from "@/http/controllers/redistribution";
import {
  requireAdminMiddleware,
  requireStaffMiddleware,
  requireUserMiddleware,
} from "@/http/middlewares/auth";

export function registerRedistributionRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const redistribution = serverRoutes.redistribution;

  const adminListRoute = {
    ...redistribution.getRequestListForAdmin,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(adminListRoute, RedistributionAdminController.getRequestListForAdmin);

  const adminDetailRoute = {
    ...redistribution.getRequestDetailForAdmin,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(adminDetailRoute, RedistributionAdminController.getRequestDetailForAdmin);

  const createRequestRoute = {
    ...redistribution.createRedistributionRequest,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(createRequestRoute, RedistributionMeController.createRedistributionRequest);

  const staffListRoute = {
    ...redistribution.getRequestListForStaff,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(staffListRoute, RedistributionStaffController.getRequestListForStaff);

  const staffDetailRoute = {
    ...redistribution.getRequestDetailForStaff,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(staffDetailRoute, RedistributionStaffController.getRequestDetailForStaff);

  const myListRoute = {
    ...redistribution.getMyRequestList,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(myListRoute, RedistributionMeController.getMyRequestList);

  const myDetailRoute = {
    ...redistribution.getMyRequestDetail,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(myDetailRoute, RedistributionMeController.getMyRequestDetail);
}
