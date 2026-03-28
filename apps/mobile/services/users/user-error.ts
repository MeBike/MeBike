import type { Result } from "@lib/result";
import type { z } from "zod";

import { readJson } from "@lib/api-decode";
import { ServerContracts } from "@mebike/shared";

import {
  asNetworkError as asSharedNetworkError,
  isUnauthorizedStatus,
  parseErrorFromSchema,
  parseUnauthorizedError,
} from "@services/shared/service-error";

type ContractUserErrorCode = z.infer<typeof ServerContracts.UsersContracts.UserErrorCodeSchema>;

export type UserErrorCode = ContractUserErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type UserError
  = | { _tag: "ApiError"; code: UserErrorCode; message?: string; details?: Record<string, unknown> }
    | { _tag: "NetworkError"; message?: string }
    | { _tag: "DecodeError" }
    | { _tag: "UnknownError"; message?: string };

export async function parseUserError(response: Response): Promise<UserError> {
  try {
    const data = await readJson(response);

    if (isUnauthorizedStatus(response.status, true)) {
      const unauthorized = parseUnauthorizedError(data);
      if (unauthorized) {
        return {
          _tag: "ApiError",
          code: unauthorized.code as UserErrorCode,
          message: unauthorized.message,
          details: unauthorized.details,
        };
      }

      return { _tag: "DecodeError" };
    }

    const parsed = parseErrorFromSchema(ServerContracts.UsersContracts.UserErrorResponseSchema, data);
    if (parsed) {
      return {
        _tag: "ApiError",
        code: parsed.code as UserErrorCode,
        message: parsed.message,
        details: parsed.details,
      };
    }

    return { _tag: "DecodeError" };
  }
  catch {
    return { _tag: "DecodeError" };
  }
}

export function asNetworkError(error: unknown): Result<never, Extract<UserError, { _tag: "NetworkError" }>> {
  return asSharedNetworkError<Extract<UserError, { _tag: "NetworkError" }>>(error);
}
