import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  RedistributionAdminController,
  RedistributionManagerController,
  RedistributionStaffController,
} from "@/http/controllers/redistribution";
import {
  requireAdminMiddleware,
  requireManagerMiddleware,
  requireRolesMiddleware,
  requireStaffMiddleware,
} from "@/http/middlewares/auth";
import { UserRole } from "generated/prisma/enums";

import { RedistributionAgencyController } from "../controllers/redistribution/agency.controller";

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

  // Staff/Agency routes
  const createRequestRoute = {
    ...redistribution.createRedistributionRequest,
    middleware: [requireRolesMiddleware([UserRole.STAFF, UserRole.AGENCY])] as const,
  } satisfies RouteConfig;
  app.openapi(createRequestRoute, RedistributionStaffController.createRedistributionRequest);

  const cancelRequestRoute = {
    ...redistribution.cancelRedistributionRequest,
    middleware: [requireRolesMiddleware([UserRole.STAFF, UserRole.AGENCY])] as const,
  } satisfies RouteConfig;
  app.openapi(cancelRequestRoute, RedistributionStaffController.cancelRedistributionRequest);

  const startTransitionRoute = {
    ...redistribution.startTransition,
    middleware: [requireRolesMiddleware([UserRole.STAFF, UserRole.AGENCY])] as const,
  } satisfies RouteConfig;
  app.openapi(startTransitionRoute, RedistributionStaffController.startTransition);

  // Staff routes
  const staffListRoute = {
    ...redistribution.getRequestListForStaff,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(staffListRoute, RedistributionStaffController.getRequestListForStaff);

  const staffHistoryRoute = {
    ...redistribution.getRequestHistoryForStaff,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(staffHistoryRoute, RedistributionStaffController.getRequestHistoryForStaff);

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

  const managerHistoryRoute = {
    ...redistribution.getRequestHistoryForManager,
    middleware: [requireManagerMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(managerHistoryRoute, RedistributionManagerController.getRequestHistoryForManager);

  const managerDetailRoute = {
    ...redistribution.getRequestDetailForManager,
    middleware: [requireManagerMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(managerDetailRoute, RedistributionManagerController.getRequestDetailForManager);

  // Manager/Agency routes
  const managerApproveRoute = {
    ...redistribution.approveRedistributionRequest,
    middleware: [requireRolesMiddleware([UserRole.MANAGER, UserRole.AGENCY])] as const,
  } satisfies RouteConfig;
  app.openapi(managerApproveRoute, RedistributionManagerController.approveRedistributionRequest);

  const managerRejectRoute = {
    ...redistribution.rejectRedistributionRequest,
    middleware: [requireRolesMiddleware([UserRole.MANAGER, UserRole.AGENCY])] as const,
  } satisfies RouteConfig;
  app.openapi(managerRejectRoute, RedistributionManagerController.rejectRedistributionRequest);

  const managerConfirmRoute = {
    ...redistribution.confirmRedistributionRequestCompletion,
    middleware: [requireRolesMiddleware([UserRole.MANAGER, UserRole.AGENCY])] as const,
  } satisfies RouteConfig;
  app.openapi(managerConfirmRoute, RedistributionManagerController.confirmRedistributionRequestCompletion);

  // Agency routes
  const agencyListRoute = {
    ...redistribution.getRequestListForAgency,
    middleware: [requireRolesMiddleware([UserRole.AGENCY])] as const,
  } satisfies RouteConfig;
  app.openapi(agencyListRoute, RedistributionAgencyController.getRequestListForAgency);

  const agencyHistoryRoute = {
    ...redistribution.getRequestHistoryForAgency,
    middleware: [requireRolesMiddleware([UserRole.AGENCY])] as const,
  } satisfies RouteConfig;
  app.openapi(agencyHistoryRoute, RedistributionAgencyController.getRequestHistoryForAgency);

  const agencyDetailRoute = {
    ...redistribution.getRequestDetailForAgency,
    middleware: [requireRolesMiddleware([UserRole.AGENCY])] as const,
  } satisfies RouteConfig;
  app.openapi(agencyDetailRoute, RedistributionAgencyController.getRequestDetailForAgency);
}
