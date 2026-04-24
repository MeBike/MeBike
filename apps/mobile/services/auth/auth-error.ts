import type { Result } from "@lib/result";
import type { z } from "zod";

import { AuthContracts } from "@mebike/shared";
import {
  type ServiceError,
  asNetworkError as asSharedNetworkError,
  isServiceErrorCode,
  normalizeServiceErrorCode,
  parseServiceError,
} from "@services/shared/service-error";

type ContractAuthErrorCode = z.infer<typeof AuthContracts.AuthErrorCodeSchema>;

export type AuthErrorCode = ContractAuthErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type AuthError = ServiceError<AuthErrorCode>;

export function isAuthContractErrorCode(code: string): code is ContractAuthErrorCode {
  return AuthContracts.AuthErrorCodeSchema.safeParse(code).success;
}

export function isAuthErrorCode(code: string): code is AuthErrorCode {
  return isServiceErrorCode(code, isAuthContractErrorCode);
}

function mapAuthErrorCode(code: string | undefined): AuthErrorCode | null {
  return normalizeServiceErrorCode(code, isAuthContractErrorCode);
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
    mapCode: mapAuthErrorCode,
  });
}

export function asNetworkError(error: unknown): Result<never, Extract<AuthError, { _tag: "NetworkError" }>> {
  return asSharedNetworkError<Extract<AuthError, { _tag: "NetworkError" }>>(error);
}
