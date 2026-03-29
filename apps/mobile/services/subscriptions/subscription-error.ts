import type { Result } from "@lib/result";
import type { z } from "zod";

import { ServerContracts } from "@mebike/shared";

import {
  type ServiceError,
  asNetworkError as asSharedNetworkError,
  parseServiceError,
} from "@services/shared/service-error";

type ContractSubscriptionErrorCode = z.infer<typeof ServerContracts.SubscriptionsContracts.SubscriptionErrorCodeSchema>;

export type SubscriptionErrorCode = ContractSubscriptionErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type SubscriptionError = ServiceError<SubscriptionErrorCode>;

function toSubscriptionErrorCode(code: string | undefined): SubscriptionErrorCode {
  if (!code || code === "UNKNOWN") {
    return "UNKNOWN";
  }

  if (code === "UNAUTHORIZED" || isSubscriptionContractErrorCode(code)) {
    return code;
  }

  return "UNKNOWN";
}

export function isSubscriptionContractErrorCode(code: string): code is ContractSubscriptionErrorCode {
  return ServerContracts.SubscriptionsContracts.SubscriptionErrorCodeSchema.safeParse(code).success;
}

export function isSubscriptionErrorCode(code: string): code is SubscriptionErrorCode {
  return code === "UNAUTHORIZED"
    || code === "UNKNOWN"
    || isSubscriptionContractErrorCode(code);
}

export function isSubscriptionApiError(
  error: { _tag: string; code?: string },
): error is Extract<SubscriptionError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isSubscriptionErrorCode(error.code);
}

export function isSubscriptionError(error: unknown): error is SubscriptionError {
  if (!error || typeof error !== "object" || !("_tag" in error) || typeof error._tag !== "string") {
    return false;
  }

  if (error._tag === "ApiError") {
    return "code" in error && typeof error.code === "string" && isSubscriptionErrorCode(error.code);
  }

  return error._tag === "NetworkError"
    || error._tag === "DecodeError"
    || error._tag === "UnknownError";
}

export async function parseSubscriptionError(response: Response): Promise<SubscriptionError> {
  return parseServiceError(response, {
    schema: ServerContracts.SubscriptionsContracts.SubscriptionErrorResponseSchema,
    mapCode: toSubscriptionErrorCode,
    includeUnauthorized: true,
  });
}

export function asNetworkError(error: unknown): Result<never, SubscriptionError> {
  return asSharedNetworkError<Extract<SubscriptionError, { _tag: "NetworkError" }>>(error);
}
