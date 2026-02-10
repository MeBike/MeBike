import { serverRoutes } from "@mebike/shared";

import { ReservationMeController } from "@/http/controllers/reservations";

export function registerReservationRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const reservations = serverRoutes.reservations;

  app.openapi(reservations.reserveBike, ReservationMeController.reserveBike);
  app.openapi(reservations.confirmReservation, ReservationMeController.confirmReservation);
  app.openapi(reservations.cancelReservation, ReservationMeController.cancelReservation);
  app.openapi(reservations.listMyReservations, ReservationMeController.listMyReservations);
  app.openapi(reservations.getMyReservation, ReservationMeController.getMyReservation);
}
