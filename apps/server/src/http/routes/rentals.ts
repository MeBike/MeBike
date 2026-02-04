import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { RentalAdminController, RentalMeController } from "@/http/controllers/rentals";
import { requireAdminMiddleware, requireAdminOrStaffMiddleware } from "@/http/middlewares/auth";

export function registerRentalRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const rentals = serverRoutes.rentals;

  app.openapi(rentals.createRental, RentalMeController.createRental);

  app.openapi(rentals.getMyRentals, RentalMeController.getMyRentals);

  app.openapi(rentals.getMyCurrentRentals, RentalMeController.getMyCurrentRentals);

  app.openapi(rentals.getMyRental, RentalMeController.getMyRental);

  app.openapi(rentals.getMyRentalCounts, RentalMeController.getMyRentalCounts);

  app.openapi(rentals.endMyRental, RentalMeController.endMyRental);

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
}
