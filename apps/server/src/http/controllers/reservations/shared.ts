import { ReservationsContracts } from "@mebike/shared";

export type ReservationsRoutes = typeof import("@mebike/shared")["serverRoutes"]["reservations"];

export const {
  ReservationErrorCodeSchema,
  reservationErrorMessages,
} = ReservationsContracts;

export type ReservationErrorResponse = ReservationsContracts.ReservationErrorResponse;
export type ReservationDetailResponse = ReservationsContracts.ReservationDetailResponse;
export type ReservationExpandedDetailResponse = ReservationsContracts.ReservationExpandedDetailResponse;
export type ListMyReservationsResponse = ReservationsContracts.ListMyReservationsResponse;
export type ListAdminReservationsResponse = ReservationsContracts.ListAdminReservationsResponse;
export type ListStaffReservationsResponse = ReservationsContracts.ListStaffReservationsResponse;
