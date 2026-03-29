import type { Result } from "@lib/result";
import type { z } from "zod";

import { ServerContracts } from "@mebike/shared";
import {
  type ServiceError,
  asNetworkError as asSharedNetworkError,
  parseServiceError,
} from "@services/shared/service-error";

type ContractWalletErrorCode = z.infer<typeof ServerContracts.WalletsContracts.WalletErrorCodeSchema>;

export type WalletErrorCode = ContractWalletErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type WalletError = ServiceError<WalletErrorCode>;

function toWalletErrorCode(code: string | undefined): WalletErrorCode {
  if (!code || code === "UNKNOWN") {
    return "UNKNOWN";
  }

  if (code === "UNAUTHORIZED" || isWalletContractErrorCode(code)) {
    return code;
  }

  return "UNKNOWN";
}

export function isWalletContractErrorCode(code: string): code is ContractWalletErrorCode {
  return ServerContracts.WalletsContracts.WalletErrorCodeSchema.safeParse(code).success;
}

export function isWalletErrorCode(code: string): code is WalletErrorCode {
  return code === "UNAUTHORIZED"
    || code === "UNKNOWN"
    || isWalletContractErrorCode(code);
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
    mapCode: toWalletErrorCode,
    includeUnauthorized: true,
  });
}

export function asNetworkError(error: unknown): Result<never, WalletError> {
  return asSharedNetworkError<Extract<WalletError, { _tag: "NetworkError" }>>(error);
}
