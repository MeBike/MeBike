import type { AuthError } from "@services/auth/auth-error";

type RegisterFieldName = "email" | "phoneNumber";

type RegisterFieldErrorPresentation = {
  field: RegisterFieldName;
  message: string;
};

const authErrorMessages = {
  duplicateEmail: "Email đã được sử dụng.",
  duplicatePhoneNumber: "Số điện thoại đã được sử dụng.",
  invalidCredentials: "Email hoặc mật khẩu không đúng.",
  invalidOtp: "Mã OTP không đúng hoặc đã hết hạn.",
  invalidResetToken: "Phiên đặt lại mật khẩu không còn hợp lệ. Vui lòng thử lại từ đầu.",
  invalidRefreshToken: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  networkError: "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
  unknownError: "Yêu cầu thất bại. Vui lòng thử lại.",
} as const;

export function presentAuthError(error: AuthError, fallback: string = authErrorMessages.unknownError): string {
  if (error._tag === "ApiError") {
    switch (error.code) {
      case "INVALID_CREDENTIALS":
        return authErrorMessages.invalidCredentials;
      case "INVALID_OTP":
        return authErrorMessages.invalidOtp;
      case "INVALID_RESET_TOKEN":
        return authErrorMessages.invalidResetToken;
      case "INVALID_REFRESH_TOKEN":
        return authErrorMessages.invalidRefreshToken;
      case "DUPLICATE_EMAIL":
        return authErrorMessages.duplicateEmail;
      case "DUPLICATE_PHONE_NUMBER":
        return authErrorMessages.duplicatePhoneNumber;
      default:
        return error.message ?? fallback;
    }
  }

  if (error._tag === "NetworkError") {
    return authErrorMessages.networkError;
  }

  return fallback;
}

export function presentRegisterFieldError(error: AuthError): RegisterFieldErrorPresentation | null {
  if (error._tag !== "ApiError") {
    return null;
  }

  switch (error.code) {
    case "DUPLICATE_EMAIL":
      return { field: "email", message: authErrorMessages.duplicateEmail };
    case "DUPLICATE_PHONE_NUMBER":
      return { field: "phoneNumber", message: authErrorMessages.duplicatePhoneNumber };
    default:
      return null;
  }
}
