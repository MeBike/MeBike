export const USERS_MESSAGES = {
  // đăng ký messages
  VALIDATION_ERROR: 'Lỗi xác thực',
  FULL_NAME_IS_REQUIRED: 'Họ và tên là bắt buộc',
  FULL_NAME_MUST_BE_A_STRING: 'Họ và tên phải là chuỗi',
  FULL_NAME_LENGTH_MUST_BE_FROM_1_TO_50: 'Họ và tên phải có độ dài từ 1 đến 50 ký tự',
  EMAIL_ALREADY_EXISTS: 'Email đã tồn tại',
  EMAIL_IS_REQUIRED: 'Email là bắt buộc',
  EMAIL_IS_INVALID: 'Email không hợp lệ',
  PASSWORD_IS_REQUIRED: 'Mật khẩu là bắt buộc',
  PASSWORD_MUST_BE_A_STRING: 'Mật khẩu phải là chuỗi',
  PASSWORD_LENGTH_MUST_BE_FROM_8_TO_30: 'Mật khẩu phải có độ dài từ 8 đến 30 ký tự',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Xác nhận mật khẩu là bắt buộc',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Xác nhận mật khẩu phải là chuỗi',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_30: 'Xác nhận mật khẩu phải có độ dài từ 8 đến 30 ký tự',
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Mật khẩu xác nhận không khớp',
  REGISTER_SUCCESS: 'Đăng ký thành công',
  IMAGE_URL_MUST_BE_A_STRING: 'URL hình ảnh phải là chuỗi',
  IMAGE_URL_MUST_BE_VALID: 'URL hình ảnh không hợp lệ',
  // đăng nhập messages
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email hoặc mật khẩu không chính xác',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  // logout messages
  ACCESS_TOKEN_IS_REQUIRED: 'Access token là bắt buộc',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Refresh token đã được sử dụng hoặc không tồn tại',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  // forgot password messages
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Vui lòng kiểm tra email để đặt lại mật khẩu',
  // verify forgot password token messages
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token là bắt buộc',
  FORGOT_PASSWORD_TOKEN_IS_INCORRECT: 'Forgot password token không chính xác',
  VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS: 'Xác thực forgot password token thành công',
  // reset password messages
  NEW_PASSWORD_CANNOT_BE_THE_SAME_AS_OLD_PASSWORD: 'Mật khẩu mới không được trùng với mật khẩu cũ',
  RESET_PASSWORD_SUCCESS: 'Đặt lại mật khẩu thành công',
  // verify email messages
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token là bắt buộc',
  EMAIL_ALREADY_VERIFIED_BEFORE: 'Email đã được xác thực trước đó',
  EMAIL_VERIFY_TOKEN_IS_INCORRECT: 'Email verify token không chính xác',
  VERIFY_EMAIL_SUCCESS: 'Xác thực email thành công',
  // resend verify email messages
  USER_BANNED: 'Người dùng đã bị cấm',
  RESEND_EMAIL_VERIFY_SUCCESS: 'Gửi lại email xác thực thành công',
  // change password messages
  USER_IS_NOT_VERIFIED: 'Người dùng chưa được xác thực',
  OLD_PASSWORD_NOT_MATCH: 'Mật khẩu cũ không khớp',
  NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_OLD_PASSWORD: 'Mật khẩu mới phải khác với mật khẩu cũ',
  CHANGE_PASSWORD_SUCCESS: 'Đổi mật khẩu thành công',
  // get me messages
  GET_ME_SUCCESS: 'Lấy thông tin người dùng thành công',
  UPDATE_ME_ERROR: 'Cập nhật thông tin người dùng thất bại',
  // update me messages
  LOCATION_MUST_BE_A_STRING: 'Vị trí phải là chuỗi',
  LOCATION_LENGTH_MUST_BE_LESS_THAN_200: 'Vị trí phải có độ dài nhỏ hơn 200 ký tự',
  USERNAME_MUST_BE_A_STRING: 'Tên người dùng phải là chuỗi',
  USERNAME_ALREADY_EXISTS: 'Tên người dùng đã tồn tại',
  UPDATE_ME_SUCCESS: 'Cập nhật thông tin người dùng thành công',
  // refresh token messages
  REFRESH_TOKEN_SUCCESS: 'Làm mới token thành công',
  // check admin role messages
  ACCESS_DENIED_ADMIN_ONLY: 'Quyền truy cập bị từ chối. Chỉ dành cho quản trị viên',
  // check staff role messages
  ACCESS_DENIED_STAFF_ONLY: 'Quyền truy cập bị từ chối. Chỉ dành cho nhân viên',
  // check admin and staff role messages
  ACCESS_DENIED_ADMIN_AND_STAFF_ONLY: 'Quyền truy cập bị từ chối. Chỉ dành cho quản trị viên và nhân viên'
} as const

export const REPORTS_MESSAGES = {
  REPORT_NOT_FOUND: 'Không tìm thấy report với ID %s',
  INVALID_NEW_STATUS: 'Trạng thái mới không hợp lệ!',
  INVALID_STATUS: 'Trạng thái không hợp lệ!',
  CREATE_SUCCESS: 'Tạo report thành công',
  UPDATE_SUCCESS: 'Update trạng thái report thành công!',
  INVALID_REPORT_ID: 'Report ID không hợp lệ!',
  REPORT_ID_IS_REQUIRED: 'Report ID là bắt buộc',
  NOT_ACTIVE: 'Report này hiện không tồn tại!',
  STATUS_IS_REQUIRED: 'Trạng thái mới là bắt buộc!',
  BIKE_ID_IS_REQUIRED: 'ID Xe đạp là bắt buộc!',
  INVALID_BIKE_ID: 'ID Xe đạp không hợp lệ!',
  BIKE_NOT_FOUND: 'Không tìm thấy xe đạp với ID %s',
  TYPE_IS_REQUIRED: 'Loại report là bắt buộc!',
  INVALID_TYPE: 'Loại report không hợp lệ!',
  MESSAGE_MUST_BE_STRING: 'Mô tả không hợp lệ!',
  MESSAGE_TOO_LONG: 'Mô tả chỉ chỉ khoảng 250 từ',
  BIKE_NOT_IN_RENTAL: 'Xe với ID %s không nằm trong phiên thuê',
  STATION_ID_IS_REQUIRED: 'ID của trạm là bắt buộc',
  INVALID_STATION_ID: 'ID của trạm không hợp lệ!',
  RENTAL_NOT_FOUND: 'Không tìm thấy thông tin của phiên thuê %s',
  INVALID_RENTAL_ID: 'ID của phiên thuê không hợp lệ!',
  STATION_NOT_FOUND: 'Không tìm thấy trạm với ID %s',
  LOCATION_IS_REQUIRED: 'Vị trí là bắt buộc!',
  GET_BY_ID_SUCCESS: 'Lấy report với ID %s thành công',
  GET_USER_REPORT_SUCCESS: 'Lấy report của user ID %s thành công',
  GET_ALL_SUCCESS: 'Lấy repport thành công',
  USER_ID_IS_REQUIRED: 'User ID là bắt buộc',
  USER_ID_INVALID: 'User ID không hợp lệ',
  DATE_IN_VALID: 'Ngày không hợp lệ',
  STAFF_ID_IS_REQUIRED: 'ID của nhân viên điều phối là bắt buộc',
  PRIORITY_IS_REQUIRED: 'Độ ưu tiên của report là bắt buộc',
  INVALID_PRIORITY: 'Độ ưu tiên không hợp lệ!'
}

export const SUPPLIER_MESSAGE = {
  CREATE_SUCCESS: 'Tạo nhà cung cấp thành công!',
  NAME_IS_REQUIRED: 'Tên nhà cung cấp là bắt buộc!',
  NAME_IN_VALID: 'Tên nhà cung cấp phải là chuỗi!',
  NAME_TOO_LONG: 'Tên nhà cung cấp không vượt quá 30 ký tự',
  ADDRESS_IN_VALID: 'Địa chỉ nhà cung cấp phải là chuỗi!',
  ADDRESS_TOO_LONG: 'Tên nhà cung cấp không vượt quá 250 ký tự',
  PHONE_IN_VALID: 'Số điện thoại nhà cung cấp phải là chuỗi!',
  PHONE_NUMBER_INVALID: 'Số điện thoại phải có 10 số',
  FEE_IN_VALID: 'Phí hợp đồng nhà cung cấp phải là số thập phân với 2 số sau dấu phẩy!',
  START_DATE_IN_VALID: 'Ngày bắt đầu hợp đồng nhà cung cấp phải là kiểu DATE',
  START_DATE_AFTER: 'Ngày bắt đầu hợp đồng phải trước ngày kết thúc của hợp đồng',
  START_DATE_IN_PAST: 'Ngày bắt đầu hợp đồng phải trước ngày hôm nay',
  END_DATE_IN_VALID: 'Ngày kết thúc hợp đồng nhà cung cấp phải là kiểu DATE',
  END_DATE_1_MONTH: 'Ngày kết thúc hợp đồng phải sau ngày bắt đầu hợp đồng 1 tháng',
  CONTRACT_IMAGE_IS_REQUIRED: 'Hình ảnh hợp đồng là bắt buộc',
  UPDATE_SUCCESS: 'Cập nhật thông tin nhà cung cấp thành công',
  SUPPLIER_ID_IN_VALID: 'ID nhà cung cấp không hợp lệ',
  SUPPLIER_NOT_FOUND: 'Không tìm thấy nhà cung cấp với ID %s',
  SUPPLIER_ID_IS_REQUIRED: 'ID nhà cung cấp là bắt buộc!',
  STATUS_INVALID: 'Trạng thái mới không hợp lệ!',
  STATUS_IS_REQUIRED: 'Trạng thái mới bắt buộc',
  STATUS_MUST_BE_STRING: 'Trạng thái mới phải là chuỗi ký tự',
  GET_BY_ID_SUCCESS: 'Lấy thông tin nhà cung cấp với ID %s thành công',
  GET_STATS_SUCCESS: 'Lấy thống kế của nhà cung cấp thành công',
  GET_STATS_SUCCESS_BY_ID: 'Lấy thống kế của nhà cung cấp với ID %s thành công'
}

export const BIKES_MESSAGES = {
  CREATE_BIKE_SUCCESS: 'Tạo xe đạp mới thành công',
  GET_BIKES_SUCCESS: 'Lấy danh sách xe đạp thành công',
  BIKE_NOT_FOUND: 'Không tìm thấy xe đạp',
  STATUS_IS_REQUIRED: 'Trạng thái là bắt buộc',
  INVALID_STATUS: 'Trạng thái không hợp lệ',
  STATION_ID_IS_REQUIRED: 'ID của trạm là bắt buộc',
  INVALID_STATION_ID: 'ID của trạm không hợp lệ',
  STATION_NOT_FOUND: 'Không tìm thấy trạm với ID được cung cấp',
  FORBIDDEN: 'Không có quyền truy cập',
  INVALID_SUPPLIER_ID: 'ID của nhà cung cấp không hợp lệ',
  SUPPLIER_NOT_FOUND: 'Không tìm thấy nhà cung cấp với ID được cung cấp',
  // get bikes by id
  GET_BIKE_SUCCESS: 'Lấy thông tin xe đạp thành công',
  BIKE_ID_IS_REQUIRED: 'ID của xe đạp là bắt buộc',
  INVALID_BIKE_ID: 'ID của xe đạp không hợp lệ',
  // delete bike
  DELETE_BIKE_SUCCESS: "Xóa xe đạp thành công",
  // history rental of bike
  GET_BIKE_RENTALS_SUCCESS: "Lấy lịch sử thuê xe thành công",
  // stats of bikes
  GET_BIKE_STATS_SUCCESS: "Lấy thống kê xe thành công",
  // update info bike
  UPDATE_BIKE_SUCCESS: 'Cập nhật thông tin xe đạp thành công',
  UPDATE_NOT_ALLOWED: 'Bạn không được phép cập nhật trường này',
  USER_CAN_ONLY_REPORT_BROKEN: 'Người dùng chỉ được phép báo hỏng xe',
  AT_LEAST_ONE_FIELD_IS_REQUIRED: 'Cần ít nhất một trường để cập nhật',
  CANNOT_REPORT_BIKE_NOT_RENTING: 'Bạn chỉ có thể báo hỏng chiếc xe bạn đang thuê',
  REPORT_BROKEN_BIKE_SUCCESS: 'Báo hỏng xe thành công'
} as const

export const RENTALS_MESSAGE = {
  // Success action
  CREATE_SESSION_SUCCESS: 'Tạo phiên thuê xe thành công',
  END_SESSION_SUCCESS: 'Kết thúc phiên thuê xe thành công',
  GET_DETAIL_SUCCESS: 'Xem chi tiết 1 phiên thuê xe thành công',
  GET_REVENUE_SUCCESS: 'Xem thống kê doanh thu thành công',
  GET_STATION_ACTIVITY_SUCCESS: 'Xem thống kê hoạt động trạm xe thành công',
  GET_RESERVATIONS_SUCCESS: 'Xem thống kê số lượt đặt/huỷ thành công',
  GET_STATION_TRAFFIC_SUCCESS: 'Xem thống kê số lượt thuê/trả theo trạm thành công',
  UPDATE_DETAIL_SUCCESS: 'Cập nhật phiên thuê thành công',
  CANCEL_RENTAL_SUCCESS: 'Huỷ phiên thuê thành công',
  // Fail action
  CREATE_SESSION_FAIL: 'Tạo phiên thuê xe không thành công',
  // Required data
  REQUIRED_USER_ID: 'Vui lòng nhập Id người dùng',
  REQUIRED_BIKE_ID: 'Vui lòng nhập Id xe đạp',
  REQUIRED_START_STATION: 'Vui lòng nhập trạm bắt đầu',
  REQUIRED_END_STATION: 'Vui lòng nhập trạm kết thúc',
  REQUIRED_ID: 'Vui lòng nhập Id của phiên thuê',
  REQUIRED_CANCELLED_REASON: 'Vui lòng nhập lí do huỷ phiên thuê',
  REQUIRED_UPDATED_REASON: 'Vui lòng nhập lí do thay đổi phiên thuê',
  // Invalid data
  INVALID_OBJECT_ID: '%s phải là 1 ObjectId hợp lệ',
  INVALID_DURATION: 'Khoảng thời gian không hợp lệ (phải là số nguyên dương)',
  INVALID_TOTAL_PRICE: 'Tổng tiền không hợp lệ (phải là 1 số không âm)',
  INVALID_REASON: 'Lí do không hợp lệ (phải là 1 chuỗi)',
  REASON_TOO_LONG: 'Lí do quá dài (chuỗi tối đa 255 kí tự)',
  INVALID_RENTAL_STATUS: 'Trạng thái phiên thuê không hợp lệ',
  INVALID_END_TIME_FORMAT: 'Thời gian kết thúc không hợp lệ (phải theo mẫu ISO8601)',
  END_TIME_MUST_GREATER_THAN_START_TIME: 'Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu',
  END_DATE_CANNOT_BE_IN_FUTURE: 'Thời gian kết thúc không thể là thời điểm ở tương lai',
  INVALID_MEDIA_URLS: 'Danh sách media_urls không hợp lệ, phải là một mảng URL hợp lệ.',
  INVALID_URL_FORMAT: 'Định dạng URL không hợp lệ: %s.',
  INVALID_STATUS: 'Trạng thái phiên thuê không hợp lệ',
  // Not found object
  USER_NOT_FOUND: 'Không tìm thấy người dùng với Id %s',
  BIKE_NOT_FOUND: 'Không tìm thấy xe đạp với Id %s',
  STATION_NOT_FOUND: 'Không tìm thấy trạm với Id %s',
  BIKE_NOT_FOUND_IN_STATION: 'Xe với Id %s không tồn tại trong trạm %s',
  NOT_FOUND_RENTED_RENTAL: 'Không tìm thấy phiên thuê nào với Id %s đang diễn ra ở thời điểm hiện tại',
  NOT_FOUND: 'Không tìm thấy phiên thuê nào với Id %s',
  // Not available
  NOT_AVAILABLE_BIKE: 'Xe chưa sẵn sàng để sử dụng',
  // Not allowed action
  CANNOT_END_OTHER_RENTAL: 'Bạn không có quyền kết thúc phiên thuê của người khác',
  CANNOT_EDIT_THIS_RENTAL_WITH_STATUS: 'Không thể chỉnh sửa phiên thuê đang ở trạng thái %s',
  CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS: 'Không thể huỷ phiên thuê đang ở trạng thái %s (Rented, Reserved only)',
  CANNOT_END_WITHOUT_END_STATION: 'Vui lòng nhập trạm kết thúc để kết thúc phiên',
  CANNOT_END_WITHOUT_END_TIME: 'Vui lòng nhập thời điểm kết thúc để kết thúc phiên',
  UPDATED_STATUS_NOT_ALLOWED: 'Bạn không thể cập nhật phiên thuê sang trạng thái %s (Completed, Cancelled only)',
  CANNOT_CANCEL_WITH_BIKE_STATUS: 'Bạn không thể huỷ phiên thuê với xe đang ở trạng thái %s (Booked, Reserved only)',
  CANNOT_EDIT_BIKE_STATUS_TO:
    'Bạn không thể cập nhật trạng thái xe thành %s khi huỷ phiên thuê (Available, Broken only)',
  // Not allowed body fields
  NOT_ALLOWED_CREATED_FIELD: '%s không nằm trong các trường được cho phép để tạo',
  NOT_ALLOWED_UPDATED_FIELD: '%s không nằm trong các trường được cho phép cập để nhật',
  NOT_ALLOWED_CANCELLED_FIELD: '%s không nằm trong các trường được cho phép để huỷ',
  // 
  NO_REASON: 'Không có nguyên nhân',
  // bike
  BIKE_IN_USE: 'Xe đang được sử dụng',
  BIKE_IS_BROKEN: 'Xe đang bị hư hỏng, chưa sẵn sàng để sử dụng',
  BIKE_IS_MAINTAINED: 'Xe đang được bảo trì, chưa sẵn sàng để sử dụng',
  BIKE_IS_RESERVED: 'Xe đã được đặt trước',
  UNAVAILABLE_BIKE: 'Xe chưa sẵn sàng để sử dụng',
  INVALID_BIKE_STATUS: 'Trạng thái xe không hợp lệ'
} as const

export const COMMON_MESSAGE = {
  CREATE_SESSION_FAIL: 'Tạo phiên thất bại: '
}

export const AUTH_MESSAGE = {
  ACCESS_DENIED: 'Bạn không có quyền truy cập tài nguyên này',
  ACCESS_DENIED_ADMIN_ONLY: 'Bạn không có quyền truy cập tài nguyên này (chỉ dành cho Admin)',
  ACCESS_DENIED_ADMIN_AND_STAFF_ONLY: 'Bạn không có quyền truy cập tài nguyên này (chỉ dành cho Staff và Admin)'
}
