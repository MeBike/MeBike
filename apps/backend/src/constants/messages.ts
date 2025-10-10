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
  // logout messages
  ACCESS_TOKEN_IS_REQUIRED: "Access token là bắt buộc",
  USED_REFRESH_TOKEN_OR_NOT_EXIST: "Refresh token đã được sử dụng hoặc không tồn tại",
  LOGOUT_SUCCESS: "Đăng xuất thành công",
  // forgot password messages
  USER_NOT_FOUND: "Không tìm thấy người dùng",
  CHECK_EMAIL_TO_RESET_PASSWORD: "Vui lòng kiểm tra email để đặt lại mật khẩu",
  // verify forgot password token messages
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: "Forgot password token là bắt buộc",
  FORGOT_PASSWORD_TOKEN_IS_INCORRECT: "Forgot password token không chính xác",
  VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS: "Xác thực forgot password token thành công",
  // reset password messages
  NEW_PASSWORD_CANNOT_BE_THE_SAME_AS_OLD_PASSWORD: "Mật khẩu mới không được trùng với mật khẩu cũ",
  RESET_PASSWORD_SUCCESS: "Đặt lại mật khẩu thành công",
  // verify email messages
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: "Email verify token là bắt buộc",
  EMAIL_ALREADY_VERIFIED_BEFORE: "Email đã được xác thực trước đó",
  EMAIL_VERIFY_TOKEN_IS_INCORRECT: "Email verify token không chính xác",
  VERIFY_EMAIL_SUCCESS: "Xác thực email thành công",
  // resend verify email messages
  USER_BANNED: "Người dùng đã bị cấm",
  RESEND_EMAIL_VERIFY_SUCCESS: "Gửi lại email xác thực thành công",
  // change password messages
  USER_IS_NOT_VERIFIED: "Người dùng chưa được xác thực",
  OLD_PASSWORD_NOT_MATCH: "Mật khẩu cũ không khớp",
  NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_OLD_PASSWORD: "Mật khẩu mới phải khác với mật khẩu cũ",
  CHANGE_PASSWORD_SUCCESS: "Đổi mật khẩu thành công",
  // get me messages
  GET_ME_SUCCESS: "Lấy thông tin người dùng thành công",
  UPDATE_ME_ERROR: "Cập nhật thông tin người dùng thất bại",
  // update me messages
  LOCATION_MUST_BE_A_STRING: "Vị trí phải là chuỗi",
  LOCATION_LENGTH_MUST_BE_LESS_THAN_200: "Vị trí phải có độ dài nhỏ hơn 200 ký tự",
  USERNAME_MUST_BE_A_STRING: "Tên người dùng phải là chuỗi",
  USERNAME_ALREADY_EXISTS: "Tên người dùng đã tồn tại",
  UPDATE_ME_SUCCESS: "Cập nhật thông tin người dùng thành công",
  // refresh token messages
  REFRESH_TOKEN_SUCCESS: "Làm mới token thành công",
  // check admin role messages
  ACCESS_DENIED_ADMIN_ONLY: "Quyền truy cập bị từ chối. Chỉ dành cho quản trị viên",
  // check staff role messages
  ACCESS_DENIED_STAFF_ONLY: "Quyền truy cập bị từ chối. Chỉ dành cho nhân viên",
} as const;

export const REPORTS_MESSAGES = {
  REPORT_NOT_FOUND: "Không tìm thấy report với ID %s",
  INVALID_NEW_STATUS: "Trạng thái mới không hợp lệ!",
  CREATE_SUCCESS: "Tạo report thành công",
  UPDATE_SUCCESS: "Update trạng thái report thành công!",
  INVALID_REPORT_ID: "Report ID không hợp lệ!",
  REPORT_ID_IS_REQUIRED: "Report ID là bắt buộc",
  NOT_ACTIVE: "Report này hiện không tồn tại!",
  STATUS_IS_REQUIRED: "Trạng thái mới là bắt buộc!",
  BIKE_ID_IS_REQUIRED: "ID Xe đạp là bắt buộc!",
  INVALID_BIKE_ID: "ID Xe đạp không hợp lệ!",
  BIKE_NOT_FOUND: "Không tìm thấy xe đạp với ID %s",
  TYPE_IS_REQUIRED: "Loại report là bắt buộc!",
  INVALID_TYPE: "Loại report không hợp lệ!",
  MESSAGE_MUST_BE_STRING: "Mô tả không hợp lệ!",
  MESSAGE_TOO_LONG: "Mô tả chỉ chỉ khoảng 250 từ",
  BIKE_NOT_IN_RENTAL: "Xe với ID %s không nằm trong phiên thuê",
  STATION_ID_IS_REQUIRED: "ID của trạm là bắt buộc",
  INVALID_STATION_ID: "ID của trạm không hợp lệ!",
  RENTAL_NOT_FOUND: "Không tìm thấy thông tin của phiên thuê %s",
  INVALID_RENTAL_ID: "ID của phiên thuê không hợp lệ!",
  STATION_NOT_FOUND: "Không tìm thấy trạm với ID %s",
  LOCATION_IS_REQUIRED: "Vị trí là bắt buộc!",
};

export const BIKES_MESSAGES = {
  CREATE_BIKE_SUCCESS: "Tạo xe đạp mới thành công",
  GET_BIKES_SUCCESS: "Lấy danh sách xe đạp thành công",
  BIKE_NOT_FOUND: "Không tìm thấy xe đạp",
  STATUS_IS_REQUIRED: "Trạng thái là bắt buộc",
  INVALID_STATUS: "Trạng thái không hợp lệ",
  STATION_ID_IS_REQUIRED: "ID của trạm là bắt buộc",
  INVALID_STATION_ID: "ID của trạm không hợp lệ",
  STATION_NOT_FOUND: "Không tìm thấy trạm với ID được cung cấp",
  FORBIDDEN: "Không có quyền truy cập",
  INVALID_SUPPLIER_ID: "ID của nhà cung cấp không hợp lệ",
  SUPPLIER_NOT_FOUND: "Không tìm thấy nhà cung cấp với ID được cung cấp",
} as const;
