import type { Result } from "@lib/result";
import type { ServiceError } from "@services/shared/service-error";
import type { z } from "zod";

import { ServerContracts } from "@mebike/shared";
import {
  asNetworkError as asSharedNetworkError,
  isServiceErrorCode,
  normalizeServiceErrorCode,
  parseServiceError,

} from "@services/shared/service-error";

type ContractRentalErrorCode = z.infer<typeof ServerContracts.RentalsContracts.RentalErrorCodeSchema>;
type ContractBikeSwapRequestErrorCode = z.infer<
  typeof ServerContracts.RentalsContracts.BikeSwapRequestErrorCodeSchema
>;

export type RentalErrorCode
  = | ContractRentalErrorCode
    | ContractBikeSwapRequestErrorCode
    | "UNAUTHORIZED"
    | "UNKNOWN";

export type RentalError = ServiceError<RentalErrorCode>;

export function isRentalContractErrorCode(code: string): code is ContractRentalErrorCode {
  return ServerContracts.RentalsContracts.RentalErrorCodeSchema.safeParse(code).success;
}

export function isBikeSwapRequestContractErrorCode(
  code: string,
): code is ContractBikeSwapRequestErrorCode {
  return ServerContracts.RentalsContracts.BikeSwapRequestErrorCodeSchema.safeParse(code).success;
}

function isRentalServiceContractErrorCode(
  code: string,
): code is ContractRentalErrorCode | ContractBikeSwapRequestErrorCode {
  return isRentalContractErrorCode(code) || isBikeSwapRequestContractErrorCode(code);
}

export function isRentalErrorCode(code: string): code is RentalErrorCode {
  return isServiceErrorCode(code, isRentalServiceContractErrorCode);
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
    mapCode: code => normalizeServiceErrorCode(code, isRentalServiceContractErrorCode),
    includeUnauthorized: true,
    includeForbidden: true,
  });
}

export async function parseBikeSwapRequestError(
  response: Response,
): Promise<RentalError> {
  return parseServiceError(response, {
    schema: ServerContracts.RentalsContracts.BikeSwapRequestErrorResponseSchema,
    mapCode: code => normalizeServiceErrorCode(code, isRentalServiceContractErrorCode),
    includeUnauthorized: true,
    includeForbidden: true,
  });
}

export function asNetworkError(error: unknown): Result<never, RentalError> {
  return asSharedNetworkError<Extract<RentalError, { _tag: "NetworkError" }>>(error);
}
