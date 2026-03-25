import type {
  CreateReservationPayload,
  PaginatedReservations,
  ReservationDetail,
  ReservationExpandedDetail,
  ReservationOption,
  ReservationStatus,
} from "@/contracts/server";

export type {
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
