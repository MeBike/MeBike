export const USERS_MESSAGES = {
  // đăng ký messages
  VALIDATION_ERROR: "Lỗi xác thực",
  FULL_NAME_IS_REQUIRED: "Họ và tên là bắt buộc",
  FULL_NAME_MUST_BE_A_STRING: "Họ và tên phải là chuỗi",
  FULL_NAME_LENGTH_MUST_BE_FROM_1_TO_50: "Họ và tên phải có độ dài từ 1 đến 50 ký tự",
  EMAIL_ALREADY_EXISTS: "Email đã tồn tại",
  EMAIL_IS_REQUIRED: "Email là bắt buộc",
  EMAIL_IS_INVALID: "Email không hợp lệ",
  PASSWORD_IS_REQUIRED: "Mật khẩu là bắt buộc",
  PASSWORD_MUST_BE_A_STRING: "Mật khẩu phải là chuỗi",
  PASSWORD_LENGTH_MUST_BE_FROM_8_TO_30: "Mật khẩu phải có độ dài từ 8 đến 30 ký tự",
  CONFIRM_PASSWORD_IS_REQUIRED: "Xác nhận mật khẩu là bắt buộc",
  CONFIRM_PASSWORD_MUST_BE_A_STRING: "Xác nhận mật khẩu phải là chuỗi",
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_30: "Xác nhận mật khẩu phải có độ dài từ 8 đến 30 ký tự",
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: "Mật khẩu xác nhận không khớp",
  REGISTER_SUCCESS: "Đăng ký thành công",
  IMAGE_URL_MUST_BE_A_STRING: "URL hình ảnh phải là chuỗi",
  IMAGE_URL_MUST_BE_VALID: "URL hình ảnh không hợp lệ",
  // đăng nhập messages
  EMAIL_OR_PASSWORD_IS_INCORRECT: "Email hoặc mật khẩu không chính xác",
  LOGIN_SUCCESS: "Đăng nhập thành công",
} as const;

export const REPORTS_MESSAGES = {
  REPORT_NOT_FOUND: "Không tìm thấy sản phẩm với ID %s",
  INVALID_NEW_STATUS: "Trạng thái mới không hợp lệ!",
  CREATE_SUCCESS: "Tạo report thành công",
  UPDATE_SUCCESS: "Update trạng thái report thành công!",
  INVALID_REPORT_ID: "Report ID không hợp lệ!",
  NOT_ACTIVE: "Report này hiện không tồn tại!",
};
