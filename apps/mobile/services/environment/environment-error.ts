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

type ContractEnvironmentErrorCode = z.infer<
  typeof ServerContracts.EnvironmentErrorCodeSchema
>;

export type EnvironmentErrorCode
  = | ContractEnvironmentErrorCode
    | "UNAUTHORIZED"
    | "UNKNOWN"
    | "VALIDATION_ERROR";

export type EnvironmentError = ServiceError<EnvironmentErrorCode>;

export function isEnvironmentContractErrorCode(
  code: string,
): code is ContractEnvironmentErrorCode {
  return ServerContracts.EnvironmentErrorCodeSchema.safeParse(code).success;
}

export function isEnvironmentErrorCode(code: string): code is EnvironmentErrorCode {
  return code === "VALIDATION_ERROR"
    || isServiceErrorCode(code, isEnvironmentContractErrorCode);
}

function mapEnvironmentErrorCode(code: string | undefined): EnvironmentErrorCode | null {
  if (code === "VALIDATION_ERROR") {
    return code;
  }

  return normalizeServiceErrorCode(code, isEnvironmentContractErrorCode);
}

export async function parseEnvironmentError(response: Response): Promise<EnvironmentError> {
  return parseServiceError(response, {
    schema: ServerContracts.ServerErrorResponseSchema,
    mapCode: mapEnvironmentErrorCode,
    includeUnauthorized: true,
    includeForbidden: true,
  });
}

export function asNetworkError(error: unknown): Result<never, EnvironmentError> {
  return asSharedNetworkError<Extract<EnvironmentError, { _tag: "NetworkError" }>>(error);
}
