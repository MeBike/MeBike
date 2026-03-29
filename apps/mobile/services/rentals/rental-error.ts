import type { Result } from "@lib/result";
import type { z } from "zod";

import { ServerContracts } from "@mebike/shared";

import {
  type ServiceError,
  asNetworkError as asSharedNetworkError,
  parseServiceError,
} from "@services/shared/service-error";

type ContractRentalErrorCode = z.infer<typeof ServerContracts.RentalsContracts.RentalErrorCodeSchema>;

export type RentalErrorCode = ContractRentalErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type RentalError = ServiceError<RentalErrorCode>;

function toRentalErrorCode(code: string | undefined): RentalErrorCode {
  if (!code || code === "UNKNOWN") {
    return "UNKNOWN";
  }

  if (code === "UNAUTHORIZED" || isRentalContractErrorCode(code)) {
    return code;
  }

  return "UNKNOWN";
}

export function isRentalContractErrorCode(code: string): code is ContractRentalErrorCode {
  return ServerContracts.RentalsContracts.RentalErrorCodeSchema.safeParse(code).success;
}

export function isRentalErrorCode(code: string): code is RentalErrorCode {
  return code === "UNAUTHORIZED"
    || code === "UNKNOWN"
    || isRentalContractErrorCode(code);
}

export function isRentalApiError(
  error: { _tag: string; code?: string },
): error is Extract<RentalError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isRentalErrorCode(error.code);
}

export async function parseRentalError(response: Response): Promise<RentalError> {
  return parseServiceError(response, {
    schema: ServerContracts.RentalsContracts.RentalErrorResponseSchema,
    mapCode: toRentalErrorCode,
    includeUnauthorized: true,
    includeForbidden: true,
  });
}

export function asNetworkError(error: unknown): Result<never, RentalError> {
  return asSharedNetworkError<Extract<RentalError, { _tag: "NetworkError" }>>(error);
}
