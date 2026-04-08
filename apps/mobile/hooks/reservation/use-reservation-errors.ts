import type { ReservationError } from "@services/reservations";

import { presentReservationError } from "@/presenters/reservations/reservation-error-presenter";
import { isReservationApiError } from "@services/reservations";

export function getReservationErrorCode(error: ReservationError): string | null {
  if (isReservationApiError(error)) {
    return error.code;
  }
  return null;
}

export function getReservationErrorMessage(error: ReservationError, fallback: string): string {
  return presentReservationError(error, fallback);
}
