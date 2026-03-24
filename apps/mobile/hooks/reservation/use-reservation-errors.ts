import type { ReservationError } from "@services/reservations";

import {
  reservationErrorMessage,
} from "@services/reservations";

export function isApiReservationError(
  error: ReservationError,
): error is Extract<ReservationError, { _tag: "ApiError" }> {
  return error._tag === "ApiError";
}

export function getReservationErrorCode(error: ReservationError): string | null {
  if (isApiReservationError(error)) {
    return error.code;
  }
  return null;
}

export function getReservationErrorMessage(error: ReservationError, fallback: string): string {
  return reservationErrorMessage(error, fallback);
}
