import type { Result } from "@lib/result";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { err } from "@lib/result";
import { ServerContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

export type SubscriptionErrorCode = string;

export type SubscriptionError
  = | { _tag: "ApiError"; code: SubscriptionErrorCode; message?: string }
    | { _tag: "NetworkError"; message?: string }
    | { _tag: "DecodeError" }
    | { _tag: "UnknownError"; message?: string };

export function subscriptionErrorMessage(error: SubscriptionError): string {
  if (error._tag === "ApiError") {
    return error.message ?? "Yêu cầu không hợp lệ";
  }
  if (error._tag === "NetworkError") {
    return "Không thể kết nối tới máy chủ.";
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export async function parseSubscriptionError(response: Response): Promise<SubscriptionError> {
  try {
    const data = await readJson(response);

    if (response.status === StatusCodes.UNAUTHORIZED) {
      const parsed = decodeWithSchema(ServerContracts.UnauthorizedErrorResponseSchema, data);
      if (parsed.ok) {
        return { _tag: "ApiError", code: "UNAUTHORIZED", message: parsed.value.error };
      }
      return { _tag: "DecodeError" };
    }

    const parsed = decodeWithSchema(ServerContracts.SubscriptionsContracts.SubscriptionErrorResponseSchema, data);
    if (parsed.ok) {
      return {
        _tag: "ApiError",
        code: parsed.value.details.code,
        message: parsed.value.error,
      };
    }
    return { _tag: "DecodeError" };
  }
  catch {
    return { _tag: "DecodeError" };
  }
}

export function asNetworkError(error: unknown): Result<never, SubscriptionError> {
  return err({
    _tag: "NetworkError",
    message: error instanceof Error ? error.message : undefined,
  });
}
