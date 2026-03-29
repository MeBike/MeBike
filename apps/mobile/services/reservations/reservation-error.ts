import type { Result } from "@lib/result";
import type { z } from "zod";

import { ServerContracts } from "@mebike/shared";
import {
  type ServiceError,
  asNetworkError as asSharedNetworkError,
  parseServiceError,
} from "@services/shared/service-error";

type ContractReservationErrorCode = z.infer<typeof ServerContracts.ReservationsContracts.ReservationErrorCodeSchema>;

export type ReservationErrorCode = ContractReservationErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type ReservationError = ServiceError<ReservationErrorCode>;

function toReservationErrorCode(code: string | undefined): ReservationErrorCode {
  if (!code || code === "UNKNOWN") {
    return "UNKNOWN";
  }

  if (code === "UNAUTHORIZED" || isReservationContractErrorCode(code)) {
    return code;
  }

  return "UNKNOWN";
}

export function isReservationContractErrorCode(code: string): code is ContractReservationErrorCode {
  return ServerContracts.ReservationsContracts.ReservationErrorCodeSchema.safeParse(code).success;
}

export function isReservationErrorCode(code: string): code is ReservationErrorCode {
  return code === "UNAUTHORIZED"
    || code === "UNKNOWN"
    || isReservationContractErrorCode(code);
}

export function isReservationApiError(
  error: { _tag: string; code?: string },
): error is Extract<ReservationError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isReservationErrorCode(error.code);
}

export function isReservationError(error: unknown): error is ReservationError {
  if (!error || typeof error !== "object" || !("_tag" in error) || typeof error._tag !== "string") {
    return false;
  }

  if (error._tag === "ApiError") {
    return "code" in error && typeof error.code === "string" && isReservationErrorCode(error.code);
  }

  return error._tag === "NetworkError"
    || error._tag === "DecodeError"
    || error._tag === "UnknownError";
}

export async function parseReservationError(response: Response): Promise<ReservationError> {
  return parseServiceError(response, {
    schema: ServerContracts.ReservationsContracts.ReservationErrorResponseSchema,
    mapCode: toReservationErrorCode,
    includeUnauthorized: true,
  });
}

export function asNetworkError(error: unknown): Result<never, ReservationError> {
  return asSharedNetworkError<Extract<ReservationError, { _tag: "NetworkError" }>>(error);
}
