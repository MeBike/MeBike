import type {
  ConfirmReservationResponse,
  CreateReservationPayload,
  PaginatedReservations,
  ReservationDetail,
  ReservationExpandedDetail,
  ReservationOption,
  ReservationStatus,
} from "@/contracts/server";

export type {
  ConfirmReservationResponse,
  CreateReservationPayload,
  PaginatedReservations,
  ReservationDetail,
  ReservationExpandedDetail,
  ReservationOption,
  ReservationStatus,
};

export type Reservation = ReservationDetail & {
  station?: ReservationExpandedDetail["station"];
  bike?: ReservationExpandedDetail["bike"];
};
