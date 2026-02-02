import { ReservationsContracts } from "@mebike/shared";

export type ReservationsRoutes = typeof import("@mebike/shared")["serverRoutes"]["reservations"];

export const {
  ReservationErrorCodeSchema,
  reservationErrorMessages,
} = ReservationsContracts;

export type ReservationErrorResponse = ReservationsContracts.ReservationErrorResponse;
export type ReservationDetailResponse = ReservationsContracts.ReservationDetailResponse;
export type ListMyReservationsResponse = ReservationsContracts.ListMyReservationsResponse;
