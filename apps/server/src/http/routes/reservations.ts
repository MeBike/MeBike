import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  ReservationAdminController,
  ReservationAgencyController,
  ReservationMeController,
  ReservationStaffController,
} from "@/http/controllers/reservations";
import {
  requireAdminMiddleware,
  requireAgencyMiddleware,
  requireAuthMiddleware,
  requireStaffOrManagerMiddleware,
} from "@/http/middlewares/auth";

export function registerReservationRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const reservations = serverRoutes.reservations;

  const reserveBikeRoute = {
    ...reservations.reserveBike,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const confirmReservationRoute = {
    ...reservations.confirmReservation,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const cancelReservationRoute = {
    ...reservations.cancelReservation,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const listMyReservationsRoute = {
    ...reservations.listMyReservations,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const getMyReservationRoute = {
    ...reservations.getMyReservation,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(reserveBikeRoute, ReservationMeController.reserveBike);
  app.openapi(confirmReservationRoute, ReservationMeController.confirmReservation);
  app.openapi(cancelReservationRoute, ReservationMeController.cancelReservation);
  app.openapi(listMyReservationsRoute, ReservationMeController.listMyReservations);
  app.openapi(getMyReservationRoute, ReservationMeController.getMyReservation);

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

  const staffListRoute = {
    ...reservations.staffListReservations,
    middleware: [requireStaffOrManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffListRoute, ReservationStaffController.staffListReservations);

  const staffGetRoute = {
    ...reservations.staffGetReservation,
    middleware: [requireStaffOrManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffGetRoute, ReservationStaffController.staffGetReservation);

  const agencyListRoute = {
    ...reservations.agencyListReservations,
    middleware: [requireAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(agencyListRoute, ReservationAgencyController.agencyListReservations);

  const agencyGetRoute = {
    ...reservations.agencyGetReservation,
    middleware: [requireAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(agencyGetRoute, ReservationAgencyController.agencyGetReservation);

  const statsSummaryRoute = {
    ...reservations.getReservationStatsSummary,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(statsSummaryRoute, ReservationAdminController.getReservationStatsSummary);
}
