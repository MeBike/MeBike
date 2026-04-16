import type { EnvironmentError } from "@services/environment";

const environmentErrorMessages = {
  activePolicyMissing: "Hệ thống chưa có chính sách môi trường đang áp dụng.",
  impactNotFound: "Chuyến đi này chưa có dữ liệu tác động môi trường.",
  rentalNotFound: "Không tìm thấy chuyến đi tương ứng để xem tác động môi trường.",
  rentalNotCompleted: "Tác động môi trường chỉ khả dụng sau khi chuyến đi đã hoàn tất.",
  unauthorized: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  validationError: "Bộ lọc ngày chưa hợp lệ. Vui lòng chọn lại.",
  networkError: "Không thể kết nối tới máy chủ.",
  unknownError: "Không thể tải dữ liệu tác động môi trường lúc này.",
} as const;

function presentEnvironmentApiError(
  error: Extract<EnvironmentError, { _tag: "ApiError" }>,
  fallback: string,
): string {
  switch (error.code) {
    case "ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND":
      return environmentErrorMessages.activePolicyMissing;
    case "ENVIRONMENT_IMPACT_NOT_FOUND":
      return environmentErrorMessages.impactNotFound;
    case "ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND":
      return environmentErrorMessages.rentalNotFound;
    case "ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED":
      return environmentErrorMessages.rentalNotCompleted;
    case "UNAUTHORIZED":
      return environmentErrorMessages.unauthorized;
    case "VALIDATION_ERROR":
      return environmentErrorMessages.validationError;
    default:
      return error.message ?? fallback;
  }
}

export function presentEnvironmentError(
  error: EnvironmentError,
  fallback: string = environmentErrorMessages.unknownError,
): string {
  if (error._tag === "ApiError") {
    return presentEnvironmentApiError(error, fallback);
  }

  if (error._tag === "NetworkError") {
    return environmentErrorMessages.networkError;
  }

  return fallback;
}
