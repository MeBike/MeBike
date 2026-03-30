import type { Result } from "@lib/result";
import type { z } from "zod";

import { AuthContracts } from "@mebike/shared";
import {
  type ServiceError,
  asNetworkError as asSharedNetworkError,
  parseServiceError,
} from "@services/shared/service-error";

export type AuthErrorCode = z.infer<typeof AuthContracts.AuthErrorCodeSchema>;

export type AuthError = ServiceError<AuthErrorCode>;

export function isAuthErrorCode(code: string): code is AuthErrorCode {
  return AuthContracts.AuthErrorCodeSchema.safeParse(code).success;
}

export function isAuthApiError(
  error: { _tag: string; code?: string },
): error is Extract<AuthError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isAuthErrorCode(error.code);
}

export async function parseAuthError(response: Response): Promise<AuthError> {
  return parseServiceError(response, {
    schema: AuthContracts.AuthErrorResponseSchema,
    mapCode: code => (code && isAuthErrorCode(code) ? code : null),
  });
}

export function asNetworkError(error: unknown): Result<never, Extract<AuthError, { _tag: "NetworkError" }>> {
  return asSharedNetworkError<Extract<AuthError, { _tag: "NetworkError" }>>(error);
}
