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

  app.openapi(rentals.endMyRental, RentalMeController.endMyRental);

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
    middleware: [requireAdminOrStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffGetRoute, RentalAdminController.adminGetRental);

  const endByAdminRoute = {
    ...rentals.endRentalByAdmin,
    middleware: [requireAdminOrStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(endByAdminRoute, RentalAdminController.endRentalByAdmin);

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

  const requestSwapRoute = {
    ...rentals.requestBikeSwap,
  } satisfies RouteConfig;

  app.openapi(requestSwapRoute, RentalMeController.requestBikeSwap);

  const staffListSwapRequestsRoute = {
    ...rentals.staffListBikeSwapRequests,
    middleware: [requireAdminOrStaffMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    staffListSwapRequestsRoute,
    RentalStaffController.staffListBikeSwapRequests,
  );

  const approveSwapRoute = {
    ...rentals.approveBikeSwapRequest,
    middleware: [requireStaffMiddleware] as const,
  } satisfies RouteConfig;

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
}
