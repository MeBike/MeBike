import type { Result } from "@lib/result";

import { readJson } from "@lib/api-decode";
import { ServerContracts } from "@mebike/shared";

import {
  asNetworkError as asSharedNetworkError,
  isUnauthorizedStatus,
  parseErrorFromSchema,
  parseUnauthorizedError,
} from "../shared/service-error";

export type RentalErrorCode = string;

export type RentalError
  = | { _tag: "ApiError"; code: RentalErrorCode; message?: string; details?: Record<string, unknown> }
    | { _tag: "NetworkError"; message?: string }
    | { _tag: "DecodeError" }
    | { _tag: "UnknownError"; message?: string };

const rentalErrorMessages: Partial<Record<RentalErrorCode, string>> = {
  ACCESS_DENIED: "Bạn không có quyền thực hiện thao tác này.",
  BIKE_IN_USE: "Xe này hiện đang được sử dụng.",
  BIKE_IS_BROKEN: "Xe này đang bị hỏng và chưa thể sử dụng.",
  BIKE_IS_MAINTAINED: "Xe này đang được bảo trì.",
  BIKE_IS_RESERVED: "Xe này đang được giữ chỗ.",
  BIKE_MISSING_STATION: "Xe này đang thiếu thông tin trạm, vui lòng thử lại sau.",
  BIKE_NOT_AVAILABLE_FOR_RENTAL: "Xe hiện chưa sẵn sàng để bắt đầu chuyến đi.",
  BIKE_NOT_FOUND: "Không tìm thấy xe phù hợp.",
  BIKE_NOT_FOUND_FOR_CHIP: "Không tìm thấy xe tương ứng với chip được quét.",
  BIKE_NOT_FOUND_IN_STATION: "Không tìm thấy xe này tại trạm đã chọn.",
  BIKE_SWAP_REQUEST_ALREADY_PENDING: "Yêu cầu đổi xe cho chuyến đi này đang chờ xử lý.",
  CANNOT_APPROVE_SWAP_THIS_RENTAL_WITH_STATUS: "Không thể duyệt đổi xe ở trạng thái chuyến đi hiện tại.",
  CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS: "Không thể hủy chuyến đi ở trạng thái hiện tại.",
  CANNOT_CANCEL_WITH_BIKE_STATUS: "Không thể hủy chuyến đi với trạng thái xe hiện tại.",
  CANNOT_CREATE_RENTAL_WITH_SOS_STATUS: "Không thể bắt đầu chuyến đi từ yêu cầu cứu hộ ở trạng thái hiện tại.",
  CANNOT_EDIT_BIKE_STATUS_TO: "Không thể cập nhật trạng thái xe như yêu cầu.",
  CANNOT_EDIT_THIS_RENTAL_WITH_STATUS: "Không thể chỉnh sửa chuyến đi ở trạng thái hiện tại.",
  CANNOT_END_OTHER_RENTAL: "Bạn không thể kết thúc chuyến đi của người khác.",
  CANNOT_END_RENTAL_WITH_SOS_STATUS: "Không thể kết thúc chuyến đi khi yêu cầu cứu hộ chưa phù hợp.",
  CANNOT_END_WITHOUT_END_STATION: "Bạn cần chọn trạm kết thúc trước khi hoàn tất chuyến đi.",
  CANNOT_END_WITHOUT_END_TIME: "Thiếu thời điểm kết thúc chuyến đi.",
  CANNOT_REQUEST_SWAP_THIS_RENTAL_WITH_STATUS: "Không thể yêu cầu đổi xe ở trạng thái chuyến đi hiện tại.",
  CARD_RENTAL_ACTIVE_EXISTS: "Thẻ này đang có một chuyến đi hoạt động.",
  END_DATE_CANNOT_BE_IN_FUTURE: "Thời điểm kết thúc không được nằm trong tương lai.",
  END_TIME_MUST_GREATER_THAN_START_TIME: "Thời điểm kết thúc phải sau thời điểm bắt đầu.",
  INVALID_BIKE_STATUS: "Trạng thái xe hiện không hợp lệ.",
  INVALID_END_TIME_FORMAT: "Thời gian kết thúc chưa đúng định dạng.",
  INVALID_OBJECT_ID: "Mã định danh không hợp lệ.",
  INVALID_RENTAL_STATUS: "Trạng thái chuyến đi không hợp lệ.",
  NOT_AVAILABLE_BIKE: "Xe hiện không sẵn sàng để sử dụng.",
  NOT_FOUND_RENTED_RENTAL: "Bạn hiện không có chuyến đi đang diễn ra.",
  NO_AVAILABLE_BIKE: "Hiện không còn xe phù hợp để đổi.",
  PROVIDE_AT_LEAST_ONE_UPDATED_FIELD_BESIDES_REASON: "Bạn cần chọn ít nhất một thông tin để cập nhật.",
  RENTAL_NOT_FOUND: "Không tìm thấy chuyến đi này.",
  RENTAL_UPDATE_FAILED: "Không thể cập nhật chuyến đi lúc này.",
  RETURN_ALREADY_CONFIRMED: "Chuyến đi này đã được xác nhận trả xe trước đó.",
  RETURN_SLOT_NOT_FOUND: "Không tìm thấy giữ chỗ trả xe hiện tại.",
  RETURN_SLOT_REQUIRED_FOR_RETURN: "Bạn cần chọn bãi trả xe trước khi kết thúc hành trình.",
  RETURN_SLOT_REQUIRES_ACTIVE_RENTAL: "Chỉ có thể giữ chỗ trả xe khi chuyến đi đang hoạt động.",
  RETURN_SLOT_STATION_MISMATCH: "Bạn chỉ có thể trả xe tại bãi đã giữ chỗ trước đó.",
  SOS_NOT_FOUND: "Không tìm thấy yêu cầu cứu hộ liên quan.",
  STATION_NOT_FOUND: "Không tìm thấy trạm phù hợp.",
  SUBSCRIPTION_NOT_FOUND: "Không tìm thấy gói tháng đã chọn.",
  SUBSCRIPTION_NOT_USABLE: "Gói tháng hiện chưa thể sử dụng cho chuyến đi này.",
  SUBSCRIPTION_USAGE_EXCEEDED: "Gói tháng của bạn đã hết lượt sử dụng.",
  UNAVAILABLE_BIKE: "Xe hiện tạm thời không khả dụng.",
  UPDATED_STATUS_NOT_ALLOWED: "Không thể chuyển chuyến đi sang trạng thái này.",
  USER_NOT_FOUND: "Không tìm thấy người dùng phù hợp.",
  USER_NOT_FOUND_FOR_CARD: "Không tìm thấy người dùng tương ứng với thẻ này.",
  USER_NOT_HAVE_WALLET: "Tài khoản của bạn chưa có ví để thực hiện giao dịch.",
};

function formatCurrencyDetail(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return `${value.toLocaleString("vi-VN")} đ`;
}

function getRentalApiErrorMessage(error: Extract<RentalError, { _tag: "ApiError" }>): string {
  if (error.code === "NOT_ENOUGH_BALANCE_TO_RENT") {
    const requiredBalance = formatCurrencyDetail(error.details?.requiredBalance);
    const currentBalance = formatCurrencyDetail(error.details?.currentBalance);

    if (requiredBalance && currentBalance) {
      return `Số dư ví không đủ để bắt đầu chuyến đi. Bạn cần ${requiredBalance} nhưng hiện chỉ còn ${currentBalance}.`;
    }

    return "Số dư ví không đủ để bắt đầu chuyến đi.";
  }

  if (error.code === "RETURN_SLOT_CAPACITY_EXCEEDED") {
    return "Bãi trả xe đã đầy, vui lòng chọn bãi khác.";
  }

  return rentalErrorMessages[error.code] ?? "Không thể xử lý yêu cầu thuê xe lúc này. Vui lòng thử lại.";
}

export function rentalErrorMessage(error: RentalError, fallback?: string): string {
  if (error._tag === "ApiError") {
    return getRentalApiErrorMessage(error);
  }
  if (error._tag === "NetworkError") {
    return "Không thể kết nối tới máy chủ.";
  }

  return fallback ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";
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
