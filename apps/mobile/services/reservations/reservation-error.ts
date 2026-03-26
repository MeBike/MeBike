import type { Result } from "@lib/result";

import { readJson } from "@lib/api-decode";
import { ServerContracts } from "@mebike/shared";
import {
  asNetworkError as asSharedNetworkError,
  isUnauthorizedStatus,
  parseErrorFromSchema,
  parseUnauthorizedError,
} from "@services/shared/service-error";

export type ReservationErrorCode = string;

export type ReservationError
  = | { _tag: "ApiError"; code: ReservationErrorCode; message?: string; details?: Record<string, unknown> }
    | { _tag: "NetworkError"; message?: string }
    | { _tag: "DecodeError" }
    | { _tag: "UnknownError"; message?: string };

const reservationErrorMessages: Partial<Record<ReservationErrorCode, string>> = {
  ACTIVE_RESERVATION_EXISTS: "Bạn đang có một lượt giữ chỗ khác còn hiệu lực.",
  BIKE_ALREADY_RESERVED: "Xe này đang được người khác giữ chỗ.",
  BIKE_NOT_AVAILABLE: "Xe hiện chưa sẵn sàng để đặt trước.",
  BIKE_NOT_FOUND: "Không tìm thấy xe phù hợp.",
  BIKE_NOT_FOUND_IN_STATION: "Không tìm thấy xe này tại trạm đã chọn.",
  INVALID_RESERVATION_TRANSITION: "Không thể chuyển lượt giữ chỗ sang trạng thái này.",
  RESERVATION_CONFIRM_BLOCKED_BY_ACTIVE_RENTAL:
    "Bạn đang có chuyến đi hoạt động nên chưa thể nhận thêm lượt giữ chỗ này.",
  RESERVATION_MISSING_BIKE: "Lượt giữ chỗ này chưa được gán xe phù hợp.",
  RESERVATION_NOT_FOUND: "Không tìm thấy lượt giữ chỗ này.",
  RESERVATION_NOT_OWNED: "Bạn không thể thao tác với lượt giữ chỗ của người khác.",
  RESERVATION_OPTION_NOT_SUPPORTED: "Hình thức đặt chỗ này hiện chưa được hỗ trợ.",
  STATION_PICKUP_SLOT_LIMIT_EXCEEDED: "Trạm đã hết chỗ nhận xe trong khung giờ này, vui lòng chọn thời gian khác.",
  SUBSCRIPTION_NOT_FOUND: "Không tìm thấy gói tháng đã chọn.",
  SUBSCRIPTION_NOT_USABLE: "Gói tháng hiện chưa thể dùng để đặt xe.",
  SUBSCRIPTION_REQUIRED: "Bạn cần có gói tháng để sử dụng lựa chọn này.",
  SUBSCRIPTION_USAGE_EXCEEDED: "Gói tháng của bạn đã hết lượt sử dụng.",
  WALLET_NOT_FOUND: "Tài khoản của bạn chưa có ví để thực hiện giao dịch.",
};

function formatCurrencyDetail(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return `${value.toLocaleString("vi-VN")} đ`;
}

function getReservationApiErrorMessage(error: Extract<ReservationError, { _tag: "ApiError" }>): string {
  if (error.code === "INSUFFICIENT_WALLET_BALANCE") {
    const attemptedDebit = formatCurrencyDetail(error.details?.attemptedDebit);
    const balance = formatCurrencyDetail(error.details?.balance);

    if (attemptedDebit && balance) {
      return `Số dư ví không đủ để đặt xe. Bạn cần ${attemptedDebit} nhưng hiện chỉ còn ${balance}.`;
    }

    return "Số dư ví không đủ để đặt xe.";
  }

  return reservationErrorMessages[error.code] ?? "Không thể xử lý yêu cầu đặt xe lúc này. Vui lòng thử lại.";
}

export function reservationErrorMessage(error: ReservationError, fallback?: string): string {
  if (error._tag === "ApiError") {
    return getReservationApiErrorMessage(error);
  }
  if (error._tag === "NetworkError") {
    return "Không thể kết nối tới máy chủ.";
  }

  return fallback ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export async function parseReservationError(response: Response): Promise<ReservationError> {
  try {
    const data = await readJson(response);

    if (isUnauthorizedStatus(response.status)) {
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

    const parsed = parseErrorFromSchema(
      ServerContracts.ReservationsContracts.ReservationErrorResponseSchema,
      data,
    );

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

export function asNetworkError(error: unknown): Result<never, ReservationError> {
  return asSharedNetworkError<Extract<ReservationError, { _tag: "NetworkError" }>>(error);
}
