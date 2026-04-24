import type { AuthError } from "@services/auth/auth-error";
import type { z } from "zod";

import { AuthContracts } from "@mebike/shared";

type RegisterFieldName = z.infer<typeof AuthContracts.RegisterRequestFieldSchema>;

type RegisterFieldErrorPresentation = {
  field: RegisterFieldName;
  message: string;
};

type ValidationIssue = {
  path?: string;
  code?: string;
};

const authErrorMessages = {
  duplicateEmail: "Email đã được sử dụng.",
  duplicatePhoneNumber: "Số điện thoại đã được sử dụng.",
  validationError: "Thông tin đăng ký chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.",
  invalidCredentials: "Email hoặc mật khẩu không đúng.",
  invalidOtp: "Mã OTP không đúng hoặc đã hết hạn.",
  invalidResetToken: "Phiên đặt lại mật khẩu không còn hợp lệ. Vui lòng thử lại từ đầu.",
  invalidRefreshToken: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  networkError: "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
  unknownError: "Yêu cầu thất bại. Vui lòng thử lại.",
} as const;

const registerFieldMessages: Record<RegisterFieldName, string> = {
  email: "Email không hợp lệ.",
  phoneNumber: "Số điện thoại phải gồm đúng 10 chữ số.",
  fullname: "Họ tên là bắt buộc.",
  password: "Mật khẩu phải có ít nhất 8 ký tự.",
};

function getValidationIssues(error: Extract<AuthError, { _tag: "ApiError" }>): ValidationIssue[] {
  return Array.isArray(error.details?.issues) ? error.details.issues : [];
}

function findRegisterIssueField(issue: ValidationIssue): RegisterFieldName | null {
  const path = AuthContracts.RegisterValidationIssuePathSchema.safeParse(issue.path);
  if (!path.success) {
    return null;
  }

  const field = path.data.slice("body.".length);
  const parsedField = AuthContracts.RegisterRequestFieldSchema.safeParse(field);
  return parsedField.success ? parsedField.data : null;
}

export function presentAuthError(error: AuthError, fallback: string = authErrorMessages.unknownError): string {
  if (error._tag === "ApiError") {
    switch (error.code) {
      case "VALIDATION_ERROR":
        return authErrorMessages.validationError;
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
    case "VALIDATION_ERROR": {
      for (const issue of getValidationIssues(error)) {
        const field = findRegisterIssueField(issue);
        if (field) {
          return { field, message: registerFieldMessages[field] };
        }
      }

      return null;
    }
    case "DUPLICATE_EMAIL":
      return { field: "email", message: authErrorMessages.duplicateEmail };
    case "DUPLICATE_PHONE_NUMBER":
      return { field: "phoneNumber", message: authErrorMessages.duplicatePhoneNumber };
    default:
      return null;
  }
}
