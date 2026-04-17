import type { UserError } from "@services/users/user-error";

type UpdateProfileFieldName = "phoneNumber";

type UpdateProfileFieldErrorPresentation = {
  field: UpdateProfileFieldName;
  message: string;
};

const userErrorMessages = {
  avatarImageTooLarge: "Ảnh đại diện quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.",
  avatarImageDimensionsTooLarge: "Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn để tiếp tục.",
  avatarUploadUnavailable: "Dịch vụ tải ảnh tạm thời không khả dụng. Vui lòng thử lại sau.",
  duplicatePhoneNumber: "Số điện thoại đã được sử dụng.",
  invalidCurrentPassword: "Mật khẩu hiện tại không đúng.",
  invalidAvatarImage: "Ảnh đại diện không hợp lệ. Hãy chọn ảnh JPG, PNG hoặc WEBP.",
  networkError: "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
  unauthorized: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  unknownError: "Yêu cầu thất bại. Vui lòng thử lại.",
  userNotFound: "Không tìm thấy thông tin tài khoản.",
} as const;

export function presentUserError(
  error: UserError,
  fallback: string = userErrorMessages.unknownError,
): string {
  if (error._tag === "ApiError") {
    switch (error.code) {
      case "AVATAR_IMAGE_TOO_LARGE":
        return userErrorMessages.avatarImageTooLarge;
      case "INVALID_AVATAR_IMAGE":
        return userErrorMessages.invalidAvatarImage;
      case "AVATAR_IMAGE_DIMENSIONS_TOO_LARGE":
        return userErrorMessages.avatarImageDimensionsTooLarge;
      case "AVATAR_UPLOAD_UNAVAILABLE":
        return userErrorMessages.avatarUploadUnavailable;
      case "DUPLICATE_PHONE_NUMBER":
        return userErrorMessages.duplicatePhoneNumber;
      case "INVALID_CURRENT_PASSWORD":
        return userErrorMessages.invalidCurrentPassword;
      case "USER_NOT_FOUND":
        return userErrorMessages.userNotFound;
      case "UNAUTHORIZED":
        return userErrorMessages.unauthorized;
      default:
        return error.message ?? fallback;
    }
  }

  if (error._tag === "NetworkError") {
    return userErrorMessages.networkError;
  }

  return fallback;
}

export function presentUpdateProfileFieldError(
  error: UserError,
): UpdateProfileFieldErrorPresentation | null {
  if (error._tag !== "ApiError") {
    return null;
  }

  switch (error.code) {
    case "DUPLICATE_PHONE_NUMBER":
      return { field: "phoneNumber", message: userErrorMessages.duplicatePhoneNumber };
    default:
      return null;
  }
}
