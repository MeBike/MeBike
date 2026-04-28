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

type ContractRatingErrorCode = z.infer<typeof ServerContracts.RatingsContracts.RatingErrorCodeSchema>;

export type RatingErrorCode = ContractRatingErrorCode | "UNAUTHORIZED" | "FORBIDDEN" | "UNKNOWN";

export type RatingError = ServiceError<RatingErrorCode>;

export function isRatingContractErrorCode(code: string): code is ContractRatingErrorCode {
  return ServerContracts.RatingsContracts.RatingErrorCodeSchema.safeParse(code).success;
}

export function isRatingErrorCode(code: string): code is RatingErrorCode {
  return isServiceErrorCode(code, isRatingContractErrorCode);
}

export function isRatingApiError(
  error: { _tag: string; code?: string },
): error is Extract<RatingError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isRatingErrorCode(error.code);
}

export async function parseRatingError(response: Response): Promise<RatingError> {
  return parseServiceError(response, {
    schema: ServerContracts.RatingsContracts.RatingErrorResponseSchema,
    mapCode: code => normalizeServiceErrorCode(code, isRatingContractErrorCode),
    includeUnauthorized: true,
  });
}

export function asNetworkError(error: unknown): Result<never, RatingError> {
  return asSharedNetworkError<Extract<RatingError, { _tag: "NetworkError" }>>(error);
}
