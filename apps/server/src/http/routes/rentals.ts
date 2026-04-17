import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  RentalAdminController,
  RentalAgencyController,
  RentalMeController,
  RentalOperatorController,
  RentalStaffController,
} from "@/http/controllers/rentals";
import {
  requireAdminMiddleware,
  requireAgencyMiddleware,
  requireRentalOperatorManagerMiddleware,
  requireRentalSupportMiddleware,
  requireStaffOrManagerMiddleware,
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

  const activeByPhoneRoute = {
    ...rentals.getActiveRentalsByPhone,
    middleware: [requireRentalSupportMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    activeByPhoneRoute,
    RentalAdminController.getActiveRentalsByPhone,
  );

  const staffGetRoute = {
    ...rentals.staffGetRental,
    middleware: [requireRentalOperatorManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffGetRoute, RentalStaffController.staffGetRental);

  const staffListRoute = {
    ...rentals.staffListRentals,
    middleware: [requireStaffOrManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffListRoute, RentalStaffController.staffListRentals);

  const confirmReturnByOperatorRoute = {
    ...rentals.confirmRentalReturnByOperator,
    middleware: [requireRentalOperatorManagerMiddleware] as const,
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

  const adminListSwapRequestsRoute = {
    ...rentals.adminListBikeSwapRequests,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    adminListSwapRequestsRoute,
    RentalAdminController.adminListBikeSwapRequests,
  );

  const operatorListSwapRequestsRoute = {
    ...rentals.operatorListBikeSwapRequests,
    middleware: [requireRentalOperatorManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    operatorListSwapRequestsRoute,
    RentalOperatorController.operatorListBikeSwapRequests,
  );

  const operatorApproveSwapRoute = {
    ...rentals.operatorApproveBikeSwapRequest,
    middleware: [requireRentalOperatorManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    operatorApproveSwapRoute,
    RentalOperatorController.operatorApproveBikeSwapRequest,
  );

  const operatorRejectSwapRequestRoute = {
    ...rentals.operatorRejectBikeSwapRequest,
    middleware: [requireRentalOperatorManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    operatorRejectSwapRequestRoute,
    RentalOperatorController.operatorRejectBikeSwapRequest,
  );

  const operatorGetSwapRequestRoute = {
    ...rentals.operatorGetBikeSwapRequests,
    middleware: [requireRentalOperatorManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    operatorGetSwapRequestRoute,
    RentalOperatorController.operatorGetBikeSwapRequest,
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

  const agencyListSwapRequestsRoute = {
    ...rentals.agencyListBikeSwapRequests,
    middleware: [requireAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    agencyListSwapRequestsRoute,
    RentalAgencyController.agencyListBikeSwapRequests,
  );

  const agencyGetSwapRequestRoute = {
    ...rentals.agencyGetBikeSwapRequests,
    middleware: [requireAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    agencyGetSwapRequestRoute,
    RentalAgencyController.agencyGetBikeSwapRequests,
  );

  const agencyApproveSwapRoute = {
    ...rentals.agencyApproveBikeSwapRequest,
    middleware: [requireAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    agencyApproveSwapRoute,
    RentalAgencyController.agencyApproveBikeSwapRequestHandler,
  );

  const agencyRejectSwapRequestRoute = {
    ...rentals.agencyRejectBikeSwapRequest,
    middleware: [requireAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    agencyRejectSwapRequestRoute,
    RentalAgencyController.agencyRejectBikeSwapRequestHandler,
  );

  app.openapi(rentals.getMyRental, RentalMeController.getMyRental);

  app.openapi(rentals.getMyCurrentReturnSlot, RentalMeController.getMyCurrentReturnSlot);

  app.openapi(rentals.createMyReturnSlot, RentalMeController.createMyReturnSlot);

  app.openapi(rentals.cancelMyReturnSlot, RentalMeController.cancelMyReturnSlot);
}
