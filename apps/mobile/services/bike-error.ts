import type { Result } from "@lib/result";
import type { ServiceError } from "@services/shared/service-error";
import type { z } from "zod";

import { ServerRoutes } from "@lib/server-routes";
import { ServerContracts } from "@mebike/shared";
import {
  asNetworkError as asSharedNetworkError,
  isServiceErrorCode,
  normalizeServiceErrorCode,
  parseServiceError,

} from "@services/shared/service-error";

type ContractBikeErrorCode = z.infer<typeof ServerContracts.BikesContracts.BikeErrorCodeSchema>;

export type BikeErrorCode = ContractBikeErrorCode | "UNAUTHORIZED" | "FORBIDDEN" | "UNKNOWN";

export type BikeError = ServiceError<BikeErrorCode>;

export function isBikeContractErrorCode(code: string): code is ContractBikeErrorCode {
  return ServerContracts.BikesContracts.BikeErrorCodeSchema.safeParse(code).success;
}

export function isBikeErrorCode(code: string): code is BikeErrorCode {
  return isServiceErrorCode(code, isBikeContractErrorCode);
}

export function isBikeApiError(
  error: { _tag: string; code?: string },
): error is Extract<BikeError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isBikeErrorCode(error.code);
}

export async function parseBikeError(response: Response): Promise<BikeError> {
  return parseServiceError(response, {
    schema: ServerRoutes.bikes.listBikes.responses[400].content["application/json"].schema,
    mapCode: code => normalizeServiceErrorCode(code, isBikeContractErrorCode),
    includeUnauthorized: true,
  });
}

export function asNetworkError(error: unknown): Result<never, BikeError> {
  return asSharedNetworkError<Extract<BikeError, { _tag: "NetworkError" }>>(error);
}
