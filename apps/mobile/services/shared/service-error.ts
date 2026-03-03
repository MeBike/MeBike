import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema } from "@lib/api-decode";
import { err } from "@lib/result";
import { ServerContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

type ErrorEnvelope = {
  error: string;
  details?: {
    code?: string;
  };
};

export type ParsedServiceError = {
  code: string;
  message?: string;
  details?: Record<string, unknown>;
};

export function parseErrorFromSchema<T extends ErrorEnvelope>(
  schema: z.ZodType<T>,
  data: unknown,
): ParsedServiceError | null {
  const parsed = decodeWithSchema(schema, data);
  if (!parsed.ok) {
    return null;
  }

  return {
    code: parsed.value.details?.code ?? "UNKNOWN",
    message: parsed.value.error,
    details: parsed.value.details as Record<string, unknown> | undefined,
  };
}

export function parseUnauthorizedError(data: unknown): ParsedServiceError | null {
  const parsed = decodeWithSchema(ServerContracts.UnauthorizedErrorResponseSchema, data);
  if (!parsed.ok) {
    return null;
  }

  return {
    code: parsed.value.details?.code ?? "UNAUTHORIZED",
    message: parsed.value.error,
    details: parsed.value.details as Record<string, unknown> | undefined,
  };
}

export function isUnauthorizedStatus(status: number, includeForbidden = false): boolean {
  return status === StatusCodes.UNAUTHORIZED
    || (includeForbidden && status === StatusCodes.FORBIDDEN);
}

export function asNetworkError<E extends { _tag: "NetworkError"; message?: string }>(
  error: unknown,
): Result<never, E> {
  return err({
    _tag: "NetworkError",
    message: error instanceof Error ? error.message : undefined,
  } as E);
}
