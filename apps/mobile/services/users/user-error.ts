import type { Result } from "@lib/result";
import type { z } from "zod";

import { ServerContracts } from "@mebike/shared";

import {
  type ServiceError,
  asNetworkError as asSharedNetworkError,
  parseServiceError,
} from "@services/shared/service-error";

type ContractUserErrorCode = z.infer<typeof ServerContracts.UsersContracts.UserErrorCodeSchema>;

export type UserErrorCode = ContractUserErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type UserError = ServiceError<UserErrorCode>;

function toUserErrorCode(code: string | undefined): UserErrorCode {
  if (!code || code === "UNKNOWN") {
    return "UNKNOWN";
  }

  if (code === "UNAUTHORIZED" || isUserContractErrorCode(code)) {
    return code;
  }

  return "UNKNOWN";
}

export function isUserContractErrorCode(code: string): code is ContractUserErrorCode {
  return ServerContracts.UsersContracts.UserErrorCodeSchema.safeParse(code).success;
}

export function isUserErrorCode(code: string): code is UserErrorCode {
  return code === "UNAUTHORIZED"
    || code === "UNKNOWN"
    || isUserContractErrorCode(code);
}

export function isUserApiError(
  error: { _tag: string; code?: string },
): error is Extract<UserError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isUserErrorCode(error.code);
}

export async function parseUserError(response: Response): Promise<UserError> {
  return parseServiceError(response, {
    schema: ServerContracts.UsersContracts.UserErrorResponseSchema,
    mapCode: toUserErrorCode,
    includeUnauthorized: true,
    includeForbidden: true,
  });
}

export function asNetworkError(error: unknown): Result<never, Extract<UserError, { _tag: "NetworkError" }>> {
  return asSharedNetworkError<Extract<UserError, { _tag: "NetworkError" }>>(error);
}
