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

type ContractFixedSlotErrorCode = z.infer<typeof ServerContracts.FixedSlotTemplatesContracts.FixedSlotTemplateErrorCodeSchema>;

export type FixedSlotErrorCode = ContractFixedSlotErrorCode | "UNAUTHORIZED" | "FORBIDDEN" | "UNKNOWN";

export type FixedSlotError = ServiceError<FixedSlotErrorCode>;

export function isFixedSlotContractErrorCode(code: string): code is ContractFixedSlotErrorCode {
  return ServerContracts.FixedSlotTemplatesContracts.FixedSlotTemplateErrorCodeSchema.safeParse(code).success;
}

export function isFixedSlotErrorCode(code: string): code is FixedSlotErrorCode {
  return isServiceErrorCode(code, isFixedSlotContractErrorCode);
}

export function isFixedSlotApiError(
  error: { _tag: string; code?: string },
): error is Extract<FixedSlotError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isFixedSlotErrorCode(error.code);
}

export async function parseFixedSlotError(response: Response): Promise<FixedSlotError> {
  return parseServiceError(response, {
    schema: ServerContracts.FixedSlotTemplatesContracts.FixedSlotTemplateErrorResponseSchema,
    mapCode: code => normalizeServiceErrorCode(code, isFixedSlotContractErrorCode),
    includeUnauthorized: true,
  });
}

export function asNetworkError(error: unknown): Result<never, FixedSlotError> {
  return asSharedNetworkError<Extract<FixedSlotError, { _tag: "NetworkError" }>>(error);
}
