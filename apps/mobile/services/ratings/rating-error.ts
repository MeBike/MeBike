import type { Result } from "@lib/result";

import { readJson } from "@lib/api-decode";

import {
  asNetworkError as asSharedNetworkError,
  isUnauthorizedStatus,
  parseUnauthorizedError,
} from "@services/shared/service-error";

export type RatingErrorCode = string;

export type RatingError
  = | { _tag: "ApiError"; code: RatingErrorCode; message?: string }
    | { _tag: "NetworkError"; message?: string }
    | { _tag: "DecodeError" }
    | { _tag: "UnknownError"; message?: string };

export function ratingErrorMessage(error: RatingError): string {
  if (error._tag === "ApiError") {
    switch (error.code) {
      case "RENTAL_NOT_COMPLETED":
        return "Chuyến đi chưa hoàn thành nên không thể đánh giá.";
      case "RATING_EXPIRED":
        return "Đã quá thời hạn 7 ngày để đánh giá chuyến đi này.";
      case "RATING_ALREADY_EXISTS":
        return "Bạn đã đánh giá chuyến đi này trước đó.";
      case "RATING_REASON_NOT_FOUND":
        return "Một hoặc nhiều lý do đánh giá không hợp lệ.";
      case "UNAUTHORIZED_RENTAL_ACCESS":
        return "Bạn không có quyền đánh giá chuyến đi này.";
      case "RENTAL_NOT_FOUND":
        return "Không tìm thấy thông tin đánh giá.";
      default:
        return error.message ?? "Yêu cầu không hợp lệ";
    }
  }

  if (error._tag === "NetworkError") {
    return "Không thể kết nối tới máy chủ.";
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export async function parseRatingError(response: Response): Promise<RatingError> {
  try {
    const data = await readJson(response);

    if (isUnauthorizedStatus(response.status)) {
      const unauthorized = parseUnauthorizedError(data);
      if (unauthorized) {
        return {
          _tag: "ApiError",
          code: unauthorized.code,
          message: unauthorized.message,
        };
      }
      return { _tag: "DecodeError" };
    }

    if (
      typeof data === "object"
      && data !== null
      && "error" in data
      && "details" in data
      && typeof (data as { error?: unknown }).error === "string"
      && typeof (data as { details?: { code?: unknown } }).details?.code === "string"
    ) {
      return {
        _tag: "ApiError",
        code: (data as { details: { code: string } }).details.code,
        message: (data as { error: string }).error,
      };
    }

    return { _tag: "DecodeError" };
  }
  catch {
    return { _tag: "DecodeError" };
  }
}

export function asNetworkError(error: unknown): Result<never, RatingError> {
  return asSharedNetworkError<Extract<RatingError, { _tag: "NetworkError" }>>(error);
}
