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

type ContractIncidentErrorCode = z.infer<
  typeof ServerContracts.IncidentsContracts.IncidentErrorCodeSchema
>;

export type IncidentErrorCode = ContractIncidentErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type IncidentError = ServiceError<IncidentErrorCode>;

export function isIncidentContractErrorCode(code: string): code is ContractIncidentErrorCode {
  return ServerContracts.IncidentsContracts.IncidentErrorCodeSchema.safeParse(code).success;
}

export function isIncidentErrorCode(code: string): code is IncidentErrorCode {
  return isServiceErrorCode(code, isIncidentContractErrorCode);
}

export function isIncidentApiError(
  error: { _tag: string; code?: string },
): error is Extract<IncidentError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isIncidentErrorCode(error.code);
}

export async function parseIncidentError(response: Response): Promise<IncidentError> {
  return parseServiceError(response, {
    schema: ServerContracts.IncidentsContracts.IncidentErrorResponseSchema,
    mapCode: code => normalizeServiceErrorCode(code, isIncidentContractErrorCode),
    includeUnauthorized: true,
    includeForbidden: true,
  });
}

export function asNetworkError(error: unknown): Result<never, IncidentError> {
  return asSharedNetworkError<Extract<IncidentError, { _tag: "NetworkError" }>>(error);
}
