import type { Result } from "@lib/result";

import { readJson } from "@lib/api-decode";
import { ServerContracts } from "@mebike/shared";

import {
  asNetworkError as asSharedNetworkError,
  isUnauthorizedStatus,
  parseErrorFromSchema,
  parseUnauthorizedError,
} from "@services/shared/service-error";

export type ReservationErrorCode = string;

export type ReservationError
  = | { _tag: "ApiError"; code: ReservationErrorCode; message?: string }
    | { _tag: "NetworkError"; message?: string }
    | { _tag: "DecodeError" }
    | { _tag: "UnknownError"; message?: string };

export function reservationErrorMessage(error: ReservationError): string {
  if (error._tag === "ApiError") {
    return error.message ?? "Yeu cau khong hop le";
  }
  if (error._tag === "NetworkError") {
    return "Khong the ket noi toi may chu.";
  }
  return "Da co loi xay ra. Vui long thu lai.";
}

export async function parseReservationError(response: Response): Promise<ReservationError> {
  try {
    const data = await readJson(response);

    if (isUnauthorizedStatus(response.status)) {
      const unauthorized = parseUnauthorizedError(data);
      if (unauthorized) {
        return {
          _tag: "ApiError",
          code: unauthorized.code,
          message: unauthorized.message,
        };
      }
      return { _tag: "DecodeError" };
    }

    const parsed = parseErrorFromSchema(
      ServerContracts.ReservationsContracts.ReservationErrorResponseSchema,
      data,
    );

    if (parsed) {
      return {
        _tag: "ApiError",
        code: parsed.code,
        message: parsed.message,
      };
    }

    return { _tag: "DecodeError" };
  }
  catch {
    return { _tag: "DecodeError" };
  }
}

export function asNetworkError(error: unknown): Result<never, ReservationError> {
  return asSharedNetworkError<Extract<ReservationError, { _tag: "NetworkError" }>>(error);
}
