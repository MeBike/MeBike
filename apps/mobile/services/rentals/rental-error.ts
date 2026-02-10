import type { Result } from "@lib/result";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { err } from "@lib/result";
import { ServerContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

export type RentalErrorCode = string;

export type RentalError
  = | { _tag: "ApiError"; code: RentalErrorCode; message?: string; details?: Record<string, unknown> }
    | { _tag: "NetworkError"; message?: string }
    | { _tag: "DecodeError" }
    | { _tag: "UnknownError"; message?: string };

export function rentalErrorMessage(error: RentalError): string {
  if (error._tag === "ApiError") {
    return error.message ?? "Yêu cầu không hợp lệ.";
  }
  if (error._tag === "NetworkError") {
    return "Không thể kết nối tới máy chủ.";
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export async function parseRentalError(response: Response): Promise<RentalError> {
  try {
    const data = await readJson(response);

    if (response.status === StatusCodes.UNAUTHORIZED || response.status === StatusCodes.FORBIDDEN) {
      const parsed = decodeWithSchema(ServerContracts.UnauthorizedErrorResponseSchema, data);
      if (parsed.ok) {
        return {
          _tag: "ApiError",
          code: "UNAUTHORIZED",
          message: parsed.value.error,
          details: parsed.value.details as unknown as Record<string, unknown>,
        };
      }
      return { _tag: "DecodeError" };
    }

    const parsed = decodeWithSchema(ServerContracts.RentalsContracts.RentalErrorResponseSchema, data);
    if (parsed.ok) {
      return {
        _tag: "ApiError",
        code: parsed.value.details?.code ?? "UNKNOWN",
        message: parsed.value.error,
        details: parsed.value.details as unknown as Record<string, unknown> | undefined,
      };
    }

    return { _tag: "DecodeError" };
  }
  catch {
    return { _tag: "DecodeError" };
  }
}

export function asNetworkError(error: unknown): Result<never, RentalError> {
  return err({
    _tag: "NetworkError",
    message: error instanceof Error ? error.message : undefined,
  });
}
