import type { ReservationError } from "@services/reservations";

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
  if (isApiReservationError(error)) {
    return error.message ?? fallback;
  }

  if (error._tag === "NetworkError" || error._tag === "UnknownError") {
    return error.message ?? fallback;
  }

  return fallback;
}
