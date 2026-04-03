import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  RentalAdminController,
  RentalMeController,
  RentalStaffController,
} from "@/http/controllers/rentals";
import {
  requireAdminMiddleware,
  requireAdminOrStaffMiddleware,
  requireStaffMiddleware,
  requireUserMiddleware,
} from "@/http/middlewares/auth";

export function registerRentalRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const rentals = serverRoutes.rentals;

  app.openapi(rentals.createRental, RentalMeController.createRental);

  app.openapi(rentals.getMyRentals, RentalMeController.getMyRentals);

  app.openapi(
    rentals.getMyCurrentRentals,
    RentalMeController.getMyCurrentRentals,
  );

  app.openapi(rentals.getMyRentalCounts, RentalMeController.getMyRentalCounts);

  app.openapi(rentals.getMyRental, RentalMeController.getMyRental);

  app.openapi(rentals.getMyCurrentReturnSlot, RentalMeController.getMyCurrentReturnSlot);

  app.openapi(rentals.createMyReturnSlot, RentalMeController.createMyReturnSlot);

  app.openapi(rentals.cancelMyReturnSlot, RentalMeController.cancelMyReturnSlot);

  const activeByPhoneRoute = {
    ...rentals.getActiveRentalsByPhone,
    middleware: [requireAdminOrStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    activeByPhoneRoute,
    RentalAdminController.getActiveRentalsByPhone,
  );

  const staffGetRoute = {
    ...rentals.staffGetRental,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffGetRoute, RentalStaffController.staffGetRental);

  const staffListRoute = {
    ...rentals.staffListRentals,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffListRoute, RentalStaffController.staffListRentals);

  const confirmReturnByOperatorRoute = {
    ...rentals.confirmRentalReturnByOperator,
    middleware: [requireAdminOrStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    confirmReturnByOperatorRoute,
    RentalAdminController.confirmRentalReturnByOperator,
  );

  const adminListRoute = {
    ...rentals.adminListRentals,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminListRoute, RentalAdminController.adminListRentals);

  const adminGetRoute = {
    ...rentals.adminGetRental,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminGetRoute, RentalAdminController.adminGetRental);

  const revenueRoute = {
    ...rentals.getRentalRevenue,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(revenueRoute, RentalAdminController.getRentalRevenue);

  const statsSummaryRoute = {
    ...rentals.getRentalStatsSummary,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(statsSummaryRoute, RentalAdminController.getRentalStatsSummary);

  const dashboardSummaryRoute = {
    ...rentals.getDashboardSummary,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(dashboardSummaryRoute, RentalAdminController.getDashboardSummary);

  const requestSwapRoute = {
    ...rentals.requestBikeSwap,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(requestSwapRoute, RentalMeController.requestBikeSwap);

  const staffListSwapRequestsRoute = {
    ...rentals.staffListBikeSwapRequests,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    staffListSwapRequestsRoute,
    RentalStaffController.staffListBikeSwapRequests,
  );

  const adminListSwapRequestsRoute = {
    ...rentals.adminListBikeSwapRequests,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    adminListSwapRequestsRoute,
    RentalAdminController.adminListBikeSwapRequests,
  );

  const staffApproveSwapRoute = {
    ...rentals.approveBikeSwapRequest,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    staffApproveSwapRoute,
    RentalStaffController.staffApproveBikeSwapRequest,
  );

  const staffRejectSwapRequestRoute = {
    ...rentals.rejectBikeSwapRequest,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    staffRejectSwapRequestRoute,
    RentalStaffController.staffRejectBikeSwapRequest,
  );

  const staffGetSwapRequestRoute = {
    ...rentals.staffGetBikeSwapRequests,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    staffGetSwapRequestRoute,
    RentalStaffController.staffGetBikeSwapRequests,
  );

  const adminGetSwapRequestRoute = {
    ...rentals.adminGetBikeSwapRequests,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    adminGetSwapRequestRoute,
    RentalAdminController.adminGetBikeSwapRequests,
  );

  const mySwapRequestsRoute = {
    ...rentals.getMyBikeSwapRequests,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    mySwapRequestsRoute,
    RentalMeController.getMyBikeSwapRequests,
  );

  const mySwapRequestRoute = {
    ...rentals.getMyBikeSwapRequest,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    mySwapRequestRoute,
    RentalMeController.getMyBikeSwapRequest,
  );
}
