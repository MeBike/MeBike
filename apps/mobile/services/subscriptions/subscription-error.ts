import type { Result } from "@lib/result";

import { readJson } from "@lib/api-decode";
import { ServerContracts } from "@mebike/shared";

import {
  asNetworkError as asSharedNetworkError,
  isUnauthorizedStatus,
  parseErrorFromSchema,
  parseUnauthorizedError,
} from "../shared/service-error";

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

    if (isUnauthorizedStatus(response.status)) {
      const unauthorized = parseUnauthorizedError(data);
      if (unauthorized) {
        return { _tag: "ApiError", code: unauthorized.code, message: unauthorized.message };
      }
      return { _tag: "DecodeError" };
    }

    const parsed = parseErrorFromSchema(
      ServerContracts.SubscriptionsContracts.SubscriptionErrorResponseSchema,
      data,
    );
    if (parsed) {
      return {
        _tag: "ApiError",
        code: parsed.code,
        message: parsed.message,
      };
    }
    return { _tag: "DecodeError" };
  }
  catch {
    return { _tag: "DecodeError" };
  }
}

export function asNetworkError(error: unknown): Result<never, SubscriptionError> {
  return asSharedNetworkError<Extract<SubscriptionError, { _tag: "NetworkError" }>>(error);
}
