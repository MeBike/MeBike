import type { ReservationError } from "@services/reservations";

const reservationErrorMessages = {
  activeReservationExists: "Bạn đang có một lượt giữ chỗ khác còn hiệu lực.",
  bikeAlreadyReserved: "Xe này đang được người khác giữ chỗ.",
  bikeNotAvailable: "Xe hiện chưa sẵn sàng để đặt trước.",
  bikeNotFound: "Không tìm thấy xe phù hợp.",
  bikeNotFoundInStation: "Không tìm thấy xe này tại trạm đã chọn.",
  insufficientWalletBalance: "Số dư ví không đủ để đặt xe.",
  invalidReservationTransition: "Không thể chuyển lượt giữ chỗ sang trạng thái này.",
  networkError: "Không thể kết nối tới máy chủ.",
  overnightOperationsClosed: "Hệ thống tạm ngưng thao tác này từ 23:00 đến 05:00 giờ Việt Nam. Vui lòng thử lại sau 05:00.",
  reservationConfirmBlockedByActiveRental:
    "Bạn đang có chuyến đi hoạt động nên chưa thể nhận thêm lượt giữ chỗ này.",
  reservationMissingBike: "Lượt giữ chỗ này chưa được gán xe phù hợp.",
  reservationNotFound: "Không tìm thấy lượt giữ chỗ này.",
  reservationNotOwned: "Bạn không thể thao tác với lượt giữ chỗ của người khác.",
  reservationOptionNotSupported: "Hình thức đặt chỗ này hiện chưa được hỗ trợ.",
  stationReservationAvailabilityTooLow:
    "Trạm này chỉ cho đặt trước khi số xe khả dụng còn trên 50% sức chứa.",
  subscriptionNotFound: "Không tìm thấy gói tháng đã chọn.",
  subscriptionNotUsable: "Gói tháng hiện chưa thể dùng để đặt xe.",
  subscriptionRequired: "Bạn cần có gói tháng để sử dụng lựa chọn này.",
  subscriptionUsageExceeded: "Gói tháng của bạn đã hết lượt sử dụng.",
  unauthorized: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  unknownError: "Không thể xử lý yêu cầu đặt xe lúc này. Vui lòng thử lại.",
  walletNotFound: "Tài khoản của bạn chưa có ví để thực hiện giao dịch.",
} as const;

function formatCurrencyDetail(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return `${value.toLocaleString("vi-VN")} đ`;
}

function presentReservationApiError(error: Extract<ReservationError, { _tag: "ApiError" }>, fallback: string): string {
  switch (error.code) {
    case "ACTIVE_RESERVATION_EXISTS":
      return reservationErrorMessages.activeReservationExists;
    case "BIKE_ALREADY_RESERVED":
      return reservationErrorMessages.bikeAlreadyReserved;
    case "BIKE_NOT_AVAILABLE":
      return reservationErrorMessages.bikeNotAvailable;
    case "BIKE_NOT_FOUND":
      return reservationErrorMessages.bikeNotFound;
    case "BIKE_NOT_FOUND_IN_STATION":
      return reservationErrorMessages.bikeNotFoundInStation;
    case "INSUFFICIENT_WALLET_BALANCE": {
      const attemptedDebit = formatCurrencyDetail(error.details?.attemptedDebit);
      const balance = formatCurrencyDetail(error.details?.balance);

      if (attemptedDebit && balance) {
        return `Số dư ví không đủ để đặt xe. Bạn cần ${attemptedDebit} nhưng hiện chỉ còn ${balance}.`;
      }

      return reservationErrorMessages.insufficientWalletBalance;
    }
    case "INVALID_RESERVATION_TRANSITION":
      return reservationErrorMessages.invalidReservationTransition;
    case "OVERNIGHT_OPERATIONS_CLOSED":
      return reservationErrorMessages.overnightOperationsClosed;
    case "RESERVATION_CONFIRM_BLOCKED_BY_ACTIVE_RENTAL":
      return reservationErrorMessages.reservationConfirmBlockedByActiveRental;
    case "RESERVATION_MISSING_BIKE":
      return reservationErrorMessages.reservationMissingBike;
    case "RESERVATION_NOT_FOUND":
      return reservationErrorMessages.reservationNotFound;
    case "RESERVATION_NOT_OWNED":
      return reservationErrorMessages.reservationNotOwned;
    case "RESERVATION_OPTION_NOT_SUPPORTED":
      return reservationErrorMessages.reservationOptionNotSupported;
    case "STATION_RESERVATION_AVAILABILITY_TOO_LOW":
      return reservationErrorMessages.stationReservationAvailabilityTooLow;
    case "SUBSCRIPTION_NOT_FOUND":
      return reservationErrorMessages.subscriptionNotFound;
    case "SUBSCRIPTION_NOT_USABLE":
      return reservationErrorMessages.subscriptionNotUsable;
    case "SUBSCRIPTION_REQUIRED":
      return reservationErrorMessages.subscriptionRequired;
    case "SUBSCRIPTION_USAGE_EXCEEDED":
      return reservationErrorMessages.subscriptionUsageExceeded;
    case "UNAUTHORIZED":
      return reservationErrorMessages.unauthorized;
    case "WALLET_NOT_FOUND":
      return reservationErrorMessages.walletNotFound;
    default:
      return error.message ?? fallback;
  }
}

export function presentReservationError(
  error: ReservationError,
  fallback: string = reservationErrorMessages.unknownError,
): string {
  if (error._tag === "ApiError") {
    return presentReservationApiError(error, fallback);
  }

  if (error._tag === "NetworkError") {
    return reservationErrorMessages.networkError;
  }

  return fallback;
}
