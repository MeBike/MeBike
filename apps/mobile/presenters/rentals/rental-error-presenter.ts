import type { RentalError } from "@services/rentals";

const rentalErrorMessages = {
  accessDenied: "Bạn không có quyền thực hiện thao tác này.",
  bikeInUse: "Xe này hiện đang được sử dụng.",
  bikeIsBroken: "Xe này đang bị hỏng và chưa thể sử dụng.",
  bikeIsMaintained: "Xe này đang được bảo trì.",
  bikeIsReserved: "Xe này đang được giữ chỗ.",
  bikeMissingStation: "Xe này đang thiếu thông tin trạm, vui lòng thử lại sau.",
  bikeNotAvailableForRental: "Xe hiện chưa sẵn sàng để bắt đầu chuyến đi.",
  bikeNotFound: "Không tìm thấy xe phù hợp.",
  bikeNotFoundForChip: "Không tìm thấy xe tương ứng với chip được quét.",
  bikeNotFoundInStation: "Không tìm thấy xe này tại trạm đã chọn.",
  bikeSwapRequestAlreadyPending: "Yêu cầu đổi xe cho chuyến đi này đang chờ xử lý.",
  cannotApproveSwapThisRentalWithStatus: "Không thể duyệt đổi xe ở trạng thái chuyến đi hiện tại.",
  cannotCancelThisRentalWithStatus: "Không thể hủy chuyến đi ở trạng thái hiện tại.",
  cannotCancelWithBikeStatus: "Không thể hủy chuyến đi với trạng thái xe hiện tại.",
  cannotCreateRentalWithSosStatus: "Không thể bắt đầu chuyến đi từ yêu cầu cứu hộ ở trạng thái hiện tại.",
  cannotEditBikeStatusTo: "Không thể cập nhật trạng thái xe như yêu cầu.",
  cannotEditThisRentalWithStatus: "Không thể chỉnh sửa chuyến đi ở trạng thái hiện tại.",
  cannotEndOtherRental: "Bạn không thể kết thúc chuyến đi của người khác.",
  cannotEndRentalWithSosStatus: "Không thể kết thúc chuyến đi khi yêu cầu cứu hộ chưa phù hợp.",
  cannotEndWithoutEndStation: "Bạn cần chọn trạm kết thúc trước khi hoàn tất chuyến đi.",
  cannotEndWithoutEndTime: "Thiếu thời điểm kết thúc chuyến đi.",
  cannotRequestSwapThisRentalWithStatus: "Không thể yêu cầu đổi xe ở trạng thái chuyến đi hiện tại.",
  cardRentalActiveExists: "Thẻ này đang có một chuyến đi hoạt động.",
  endDateCannotBeInFuture: "Thời điểm kết thúc không được nằm trong tương lai.",
  endTimeMustGreaterThanStartTime: "Thời điểm kết thúc phải sau thời điểm bắt đầu.",
  invalidBikeStatus: "Trạng thái xe hiện không hợp lệ.",
  invalidEndTimeFormat: "Thời gian kết thúc chưa đúng định dạng.",
  invalidObjectId: "Mã định danh không hợp lệ.",
  invalidRentalStatus: "Trạng thái chuyến đi không hợp lệ.",
  networkError: "Không thể kết nối tới máy chủ.",
  notAvailableBike: "Xe hiện không sẵn sàng để sử dụng.",
  notEnoughBalanceToRent: "Số dư ví không đủ để bắt đầu chuyến đi.",
  notFoundRentedRental: "Bạn hiện không có chuyến đi đang diễn ra.",
  noAvailableBike: "Hiện không còn xe phù hợp để đổi.",
  provideAtLeastOneUpdatedFieldBesidesReason: "Bạn cần chọn ít nhất một thông tin để cập nhật.",
  rentalNotFound: "Không tìm thấy chuyến đi này.",
  rentalUpdateFailed: "Không thể cập nhật chuyến đi lúc này.",
  returnAlreadyConfirmed: "Chuyến đi này đã được xác nhận trả xe trước đó.",
  returnSlotCapacityExceeded: "Bãi trả xe đã đầy, vui lòng chọn bãi khác.",
  returnSlotNotFound: "Không tìm thấy giữ chỗ trả xe hiện tại.",
  returnSlotRequiredForReturn: "Bạn cần chọn bãi trả xe trước khi kết thúc hành trình.",
  returnSlotRequiresActiveRental: "Chỉ có thể giữ chỗ trả xe khi chuyến đi đang hoạt động.",
  returnSlotStationMismatch: "Bạn chỉ có thể trả xe tại bãi đã giữ chỗ trước đó.",
  sosNotFound: "Không tìm thấy yêu cầu cứu hộ liên quan.",
  stationNotFound: "Không tìm thấy trạm phù hợp.",
  subscriptionNotFound: "Không tìm thấy gói tháng đã chọn.",
  subscriptionNotUsable: "Gói tháng hiện chưa thể sử dụng cho chuyến đi này.",
  subscriptionUsageExceeded: "Gói tháng của bạn đã hết lượt sử dụng.",
  unavailableBike: "Xe hiện tạm thời không khả dụng.",
  unauthorized: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  unknownError: "Không thể xử lý yêu cầu thuê xe lúc này. Vui lòng thử lại.",
  updatedStatusNotAllowed: "Không thể chuyển chuyến đi sang trạng thái này.",
  userNotFound: "Không tìm thấy người dùng phù hợp.",
  userNotFoundForCard: "Không tìm thấy người dùng tương ứng với thẻ này.",
  userNotHaveWallet: "Tài khoản của bạn chưa có ví để thực hiện giao dịch.",
  validationError: "Dữ liệu gửi lên chưa hợp lệ. Vui lòng thử lại.",
} as const;

function formatCurrencyDetail(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return `${value.toLocaleString("vi-VN")} đ`;
}

function presentRentalApiError(error: Extract<RentalError, { _tag: "ApiError" }>, fallback: string): string {
  switch (error.code) {
    case "ACCESS_DENIED":
      return rentalErrorMessages.accessDenied;
    case "BIKE_IN_USE":
      return rentalErrorMessages.bikeInUse;
    case "BIKE_IS_BROKEN":
      return rentalErrorMessages.bikeIsBroken;
    case "BIKE_IS_MAINTAINED":
      return rentalErrorMessages.bikeIsMaintained;
    case "BIKE_IS_RESERVED":
      return rentalErrorMessages.bikeIsReserved;
    case "BIKE_MISSING_STATION":
      return rentalErrorMessages.bikeMissingStation;
    case "BIKE_NOT_AVAILABLE_FOR_RENTAL":
      return rentalErrorMessages.bikeNotAvailableForRental;
    case "BIKE_NOT_FOUND":
      return rentalErrorMessages.bikeNotFound;
    case "BIKE_NOT_FOUND_FOR_CHIP":
      return rentalErrorMessages.bikeNotFoundForChip;
    case "BIKE_NOT_FOUND_IN_STATION":
      return rentalErrorMessages.bikeNotFoundInStation;
    case "BIKE_SWAP_REQUEST_ALREADY_PENDING":
      return rentalErrorMessages.bikeSwapRequestAlreadyPending;
    case "CANNOT_APPROVE_SWAP_THIS_RENTAL_WITH_STATUS":
      return rentalErrorMessages.cannotApproveSwapThisRentalWithStatus;
    case "CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS":
      return rentalErrorMessages.cannotCancelThisRentalWithStatus;
    case "CANNOT_CANCEL_WITH_BIKE_STATUS":
      return rentalErrorMessages.cannotCancelWithBikeStatus;
    case "CANNOT_CREATE_RENTAL_WITH_SOS_STATUS":
      return rentalErrorMessages.cannotCreateRentalWithSosStatus;
    case "CANNOT_EDIT_BIKE_STATUS_TO":
      return rentalErrorMessages.cannotEditBikeStatusTo;
    case "CANNOT_EDIT_THIS_RENTAL_WITH_STATUS":
      return rentalErrorMessages.cannotEditThisRentalWithStatus;
    case "CANNOT_END_OTHER_RENTAL":
      return rentalErrorMessages.cannotEndOtherRental;
    case "CANNOT_END_RENTAL_WITH_SOS_STATUS":
      return rentalErrorMessages.cannotEndRentalWithSosStatus;
    case "CANNOT_END_WITHOUT_END_STATION":
      return rentalErrorMessages.cannotEndWithoutEndStation;
    case "CANNOT_END_WITHOUT_END_TIME":
      return rentalErrorMessages.cannotEndWithoutEndTime;
    case "CANNOT_REQUEST_SWAP_THIS_RENTAL_WITH_STATUS":
      return rentalErrorMessages.cannotRequestSwapThisRentalWithStatus;
    case "CARD_RENTAL_ACTIVE_EXISTS":
      return rentalErrorMessages.cardRentalActiveExists;
    case "END_DATE_CANNOT_BE_IN_FUTURE":
      return rentalErrorMessages.endDateCannotBeInFuture;
    case "END_TIME_MUST_GREATER_THAN_START_TIME":
      return rentalErrorMessages.endTimeMustGreaterThanStartTime;
    case "INVALID_BIKE_STATUS":
      return rentalErrorMessages.invalidBikeStatus;
    case "INVALID_END_TIME_FORMAT":
      return rentalErrorMessages.invalidEndTimeFormat;
    case "INVALID_OBJECT_ID":
      return rentalErrorMessages.invalidObjectId;
    case "INVALID_RENTAL_STATUS":
      return rentalErrorMessages.invalidRentalStatus;
    case "NOT_AVAILABLE_BIKE":
      return rentalErrorMessages.notAvailableBike;
    case "NOT_ENOUGH_BALANCE_TO_RENT": {
      const requiredBalance = formatCurrencyDetail(error.details?.requiredBalance);
      const currentBalance = formatCurrencyDetail(error.details?.currentBalance);

      if (requiredBalance && currentBalance) {
        return `Số dư ví không đủ để bắt đầu chuyến đi. Bạn cần ${requiredBalance} nhưng hiện chỉ còn ${currentBalance}.`;
      }

      return rentalErrorMessages.notEnoughBalanceToRent;
    }
    case "NOT_FOUND_RENTED_RENTAL":
      return rentalErrorMessages.notFoundRentedRental;
    case "NO_AVAILABLE_BIKE":
      return rentalErrorMessages.noAvailableBike;
    case "PROVIDE_AT_LEAST_ONE_UPDATED_FIELD_BESIDES_REASON":
      return rentalErrorMessages.provideAtLeastOneUpdatedFieldBesidesReason;
    case "RENTAL_NOT_FOUND":
      return rentalErrorMessages.rentalNotFound;
    case "RENTAL_UPDATE_FAILED":
      return rentalErrorMessages.rentalUpdateFailed;
    case "RETURN_ALREADY_CONFIRMED":
      return rentalErrorMessages.returnAlreadyConfirmed;
    case "RETURN_SLOT_CAPACITY_EXCEEDED":
      return rentalErrorMessages.returnSlotCapacityExceeded;
    case "RETURN_SLOT_NOT_FOUND":
      return rentalErrorMessages.returnSlotNotFound;
    case "RETURN_SLOT_REQUIRED_FOR_RETURN":
      return rentalErrorMessages.returnSlotRequiredForReturn;
    case "RETURN_SLOT_REQUIRES_ACTIVE_RENTAL":
      return rentalErrorMessages.returnSlotRequiresActiveRental;
    case "RETURN_SLOT_STATION_MISMATCH":
      return rentalErrorMessages.returnSlotStationMismatch;
    case "SOS_NOT_FOUND":
      return rentalErrorMessages.sosNotFound;
    case "STATION_NOT_FOUND":
      return rentalErrorMessages.stationNotFound;
    case "SUBSCRIPTION_NOT_FOUND":
      return rentalErrorMessages.subscriptionNotFound;
    case "SUBSCRIPTION_NOT_USABLE":
      return rentalErrorMessages.subscriptionNotUsable;
    case "SUBSCRIPTION_USAGE_EXCEEDED":
      return rentalErrorMessages.subscriptionUsageExceeded;
    case "UNAUTHORIZED":
      return rentalErrorMessages.unauthorized;
    case "UNAVAILABLE_BIKE":
      return rentalErrorMessages.unavailableBike;
    case "UPDATED_STATUS_NOT_ALLOWED":
      return rentalErrorMessages.updatedStatusNotAllowed;
    case "USER_NOT_FOUND":
      return rentalErrorMessages.userNotFound;
    case "USER_NOT_FOUND_FOR_CARD":
      return rentalErrorMessages.userNotFoundForCard;
    case "USER_NOT_HAVE_WALLET":
      return rentalErrorMessages.userNotHaveWallet;
    case "VALIDATION_ERROR":
      return rentalErrorMessages.validationError;
    default:
      return error.message ?? fallback;
  }
}

export function presentRentalError(
  error: RentalError,
  fallback: string = rentalErrorMessages.unknownError,
): string {
  if (error._tag === "ApiError") {
    return presentRentalApiError(error, fallback);
  }

  if (error._tag === "NetworkError") {
    return rentalErrorMessages.networkError;
  }

  return fallback;
}
