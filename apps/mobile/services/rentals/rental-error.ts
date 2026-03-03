import type { Result } from "@lib/result";

import { readJson } from "@lib/api-decode";
import { ServerContracts } from "@mebike/shared";
import {
  asNetworkError as asSharedNetworkError,
  isUnauthorizedStatus,
  parseErrorFromSchema,
  parseUnauthorizedError,
} from "@services/shared/service-error";

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

    if (isUnauthorizedStatus(response.status, true)) {
      const unauthorized = parseUnauthorizedError(data);
      if (unauthorized) {
        return {
          _tag: "ApiError",
          code: unauthorized.code,
          message: unauthorized.message,
          details: unauthorized.details,
        };
      }
      return { _tag: "DecodeError" };
    }

    const parsed = parseErrorFromSchema(ServerContracts.RentalsContracts.RentalErrorResponseSchema, data);
    if (parsed) {
      return {
        _tag: "ApiError",
        code: parsed.code,
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

export function asNetworkError(error: unknown): Result<never, RentalError> {
  return asSharedNetworkError<Extract<RentalError, { _tag: "NetworkError" }>>(error);
}
