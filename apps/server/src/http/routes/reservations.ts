import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  ReservationAdminController,
  ReservationMeController,
} from "@/http/controllers/reservations";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerReservationRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const reservations = serverRoutes.reservations;

  app.openapi(reservations.reserveBike, ReservationMeController.reserveBike);
  app.openapi(reservations.confirmReservation, ReservationMeController.confirmReservation);
  app.openapi(reservations.cancelReservation, ReservationMeController.cancelReservation);
  app.openapi(reservations.listMyReservations, ReservationMeController.listMyReservations);
  app.openapi(reservations.getMyReservation, ReservationMeController.getMyReservation);

  const adminListRoute = {
    ...reservations.adminListReservations,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminListRoute, ReservationAdminController.adminListReservations);

  const adminGetRoute = {
    ...reservations.adminGetReservation,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminGetRoute, ReservationAdminController.adminGetReservation);
}
