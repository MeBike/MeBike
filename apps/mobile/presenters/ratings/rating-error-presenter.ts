import type { RatingError } from "@services/ratings";

const ratingErrorMessages = {
  networkError: "Không thể kết nối tới máy chủ.",
  ratingAlreadyExists: "Bạn đã đánh giá chuyến đi này trước đó.",
  ratingExpired: "Đã quá thời hạn 7 ngày để đánh giá chuyến đi này.",
  ratingReasonNotFound: "Một hoặc nhiều lý do đánh giá không hợp lệ.",
  rentalNotCompleted: "Chuyến đi chưa hoàn thành nên không thể đánh giá.",
  rentalNotFound: "Không tìm thấy thông tin đánh giá.",
  unauthorized: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  unauthorizedRentalAccess: "Bạn không có quyền đánh giá chuyến đi này.",
  unknownError: "Đã có lỗi xảy ra. Vui lòng thử lại.",
} as const;

export function presentRatingError(
  error: RatingError,
  fallback: string = ratingErrorMessages.unknownError,
): string {
  if (error._tag === "ApiError") {
    switch (error.code) {
      case "RATING_ALREADY_EXISTS":
        return ratingErrorMessages.ratingAlreadyExists;
      case "RATING_EXPIRED":
        return ratingErrorMessages.ratingExpired;
      case "RATING_REASON_NOT_FOUND":
        return ratingErrorMessages.ratingReasonNotFound;
      case "RENTAL_NOT_COMPLETED":
        return ratingErrorMessages.rentalNotCompleted;
      case "RENTAL_NOT_FOUND":
        return ratingErrorMessages.rentalNotFound;
      case "UNAUTHORIZED":
        return ratingErrorMessages.unauthorized;
      case "UNAUTHORIZED_RENTAL_ACCESS":
        return ratingErrorMessages.unauthorizedRentalAccess;
      default:
        return error.message ?? fallback;
    }
  }

  if (error._tag === "NetworkError") {
    return ratingErrorMessages.networkError;
  }

  return fallback;
}
