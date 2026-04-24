import type { z } from "zod";

import { ServerContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

import type { Result } from "@lib/result";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { err } from "@lib/result";

type ErrorEnvelope = {
  error: string;
  details?: {
    code?: string;
  };
};

type ContractCodeGuard<TCode extends string> = (code: string) => code is TCode;

export type CommonServiceErrorCode = "UNAUTHORIZED" | "UNKNOWN";

export type ParsedServiceError = {
  code: string;
  message?: string;
  details?: Record<string, unknown>;
};

export type ApiServiceError<TCode extends string> = {
  _tag: "ApiError";
  code: TCode;
  message?: string;
  details?: Record<string, unknown>;
};

export type NetworkServiceError = {
  _tag: "NetworkError";
  message?: string;
};

export type DecodeServiceError = {
  _tag: "DecodeError";
};

export type UnknownServiceError = {
  _tag: "UnknownError";
  message?: string;
};

export type ServiceError<TCode extends string>
  = | ApiServiceError<TCode>
    | NetworkServiceError
    | DecodeServiceError
    | UnknownServiceError;

export function normalizeServiceErrorCode<TCode extends string>(
  code: string | undefined,
  isContractCode: ContractCodeGuard<TCode>,
): TCode | CommonServiceErrorCode {
  if (!code || code === "UNKNOWN") {
    return "UNKNOWN";
  }

  if (code === "UNAUTHORIZED" || isContractCode(code)) {
    return code;
  }

  return "UNKNOWN";
}

export function isServiceErrorCode<TCode extends string>(
  code: string,
  isContractCode: ContractCodeGuard<TCode>,
): code is TCode | CommonServiceErrorCode {
  return code === "UNAUTHORIZED"
    || code === "UNKNOWN"
    || isContractCode(code);
}

type ParseServiceErrorOptions<TCode extends string, TSchema extends ErrorEnvelope> = {
  schema: z.ZodType<TSchema>;
  mapCode: (code: string | undefined) => TCode | null;
  includeUnauthorized?: boolean;
  includeForbidden?: boolean;
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

export async function parseServiceError<TCode extends string, TSchema extends ErrorEnvelope>(
  response: Response,
  options: ParseServiceErrorOptions<TCode, TSchema>,
): Promise<ServiceError<TCode>> {
  const {
    schema,
    mapCode,
    includeUnauthorized = false,
    includeForbidden = false,
  } = options;

  try {
    const data = await readJson(response);

    if (includeUnauthorized && isUnauthorizedStatus(response.status, includeForbidden)) {
      const parsed = parseErrorFromSchema(schema, data);
      if (parsed) {
        const parsedCode = mapCode(parsed.code);
        if (parsedCode) {
          return {
            _tag: "ApiError",
            code: parsedCode,
            message: parsed.message,
            details: parsed.details,
          };
        }
      }

      const unauthorized = parseUnauthorizedError(data);
      if (!unauthorized) {
        return { _tag: "DecodeError" };
      }

      const code = mapCode(unauthorized.code);
      if (!code) {
        return { _tag: "DecodeError" };
      }

      return {
        _tag: "ApiError",
        code,
        message: unauthorized.message,
        details: unauthorized.details,
      };
    }

    const parsed = parseErrorFromSchema(schema, data);
    if (!parsed) {
      return { _tag: "DecodeError" };
    }

    const code = mapCode(parsed.code);
    if (!code) {
      return { _tag: "DecodeError" };
    }

    return {
      _tag: "ApiError",
      code,
      message: parsed.message,
      details: parsed.details,
    };
  }
  catch {
    return { _tag: "DecodeError" };
  }
}

export function asNetworkError<E extends { _tag: "NetworkError"; message?: string }>(
  error: unknown,
): Result<never, E> {
  return err({
    _tag: "NetworkError",
    message: error instanceof Error ? error.message : undefined,
  } as E);
}
