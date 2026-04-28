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

type ContractWalletErrorCode = z.infer<typeof ServerContracts.WalletsContracts.WalletErrorCodeSchema>;

export type WalletErrorCode = ContractWalletErrorCode | "UNAUTHORIZED" | "FORBIDDEN" | "UNKNOWN";

export type WalletError = ServiceError<WalletErrorCode>;

export function isWalletContractErrorCode(code: string): code is ContractWalletErrorCode {
  return ServerContracts.WalletsContracts.WalletErrorCodeSchema.safeParse(code).success;
}

export function isWalletErrorCode(code: string): code is WalletErrorCode {
  return isServiceErrorCode(code, isWalletContractErrorCode);
}

export function isWalletApiError(
  error: { _tag: string; code?: string },
): error is Extract<WalletError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isWalletErrorCode(error.code);
}

export async function parseWalletError(response: Response): Promise<WalletError> {
  return parseServiceError(response, {
    schema: ServerContracts.WalletsContracts.WalletErrorResponseSchema,
    mapCode: code => normalizeServiceErrorCode(code, isWalletContractErrorCode),
    includeUnauthorized: true,
  });
}

export function asNetworkError(error: unknown): Result<never, WalletError> {
  return asSharedNetworkError<Extract<WalletError, { _tag: "NetworkError" }>>(error);
}
