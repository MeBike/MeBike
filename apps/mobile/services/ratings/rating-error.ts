import type { Result } from "@lib/result";
import type { z } from "zod";

import { ServerContracts } from "@mebike/shared";

import {
  type ServiceError,
  asNetworkError as asSharedNetworkError,
  parseServiceError,
} from "@services/shared/service-error";

type ContractRatingErrorCode = z.infer<typeof ServerContracts.RatingsContracts.RatingErrorCodeSchema>;

export type RatingErrorCode = ContractRatingErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type RatingError = ServiceError<RatingErrorCode>;

function toRatingErrorCode(code: string | undefined): RatingErrorCode {
  if (!code || code === "UNKNOWN") {
    return "UNKNOWN";
  }

  if (code === "UNAUTHORIZED" || isRatingContractErrorCode(code)) {
    return code;
  }

  return "UNKNOWN";
}

export function isRatingContractErrorCode(code: string): code is ContractRatingErrorCode {
  return ServerContracts.RatingsContracts.RatingErrorCodeSchema.safeParse(code).success;
}

export function isRatingErrorCode(code: string): code is RatingErrorCode {
  return code === "UNAUTHORIZED"
    || code === "UNKNOWN"
    || isRatingContractErrorCode(code);
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
    mapCode: toRatingErrorCode,
    includeUnauthorized: true,
  });
}

export function asNetworkError(error: unknown): Result<never, RatingError> {
  return asSharedNetworkError<Extract<RatingError, { _tag: "NetworkError" }>>(error);
}
