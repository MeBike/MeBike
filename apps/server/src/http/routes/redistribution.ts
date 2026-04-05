import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  RedistributionAdminController,
  RedistributionStaffController,
} from "@/http/controllers/redistribution";
import {
  requireAdminMiddleware,
  requireManagerMiddleware,
  requireStaffMiddleware,
} from "@/http/middlewares/auth";

export function registerRedistributionRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const redistribution = serverRoutes.redistribution;

  // Admin routes
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

  // Staff routes
  const createRequestRoute = {
    ...redistribution.createRedistributionRequest,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(createRequestRoute, RedistributionStaffController.createRedistributionRequest);

  const cancelRequestRoute = {
    ...redistribution.cancelRedistributionRequest,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(cancelRequestRoute, RedistributionStaffController.cancelRedistributionRequest);

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

  // Manager routes
  const managerListRoute = {
    ...redistribution.getRequestListForManager,
    middleware: [requireManagerMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(managerListRoute, RedistributionManagerController.getRequestListForManager);

  const managerDetailRoute = {
    ...redistribution.getRequestDetailForManager,
    middleware: [requireManagerMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(managerDetailRoute, RedistributionManagerController.getRequestDetailForManager);
}
