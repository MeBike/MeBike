export enum UserVerifyStatus {
  Unverified = 'UNVERIFIED',
  Verified = 'VERIFIED',
  Banned = 'BANNED'
}

export enum TokenType {
  AccessToken = 'ACCESS_TOKEN',
  RefreshToken = 'REFRESH_TOKEN',
  ForgotPasswordToken = 'FORGOT_PASSWORD_TOKEN',
  EmailVerificationToken = 'EMAIL_VERIFICATION_TOKEN'
}

export enum Role {
  User = 'USER',
  Staff = 'STAFF',
  Admin = 'ADMIN',
  Sos = 'SOS'
}

export enum ReportStatus {
  Pending = 'ĐANG CHỜ XỬ LÝ',
  InProgress = 'ĐANG XỬ LÝ',
  Resolved = 'ĐÃ GIẢI QUYẾT',
  CannotResolved = 'KHÔNG GIẢI QUYẾT ĐƯỢC',
  Cancel = 'ĐÃ HỦY'
}

export enum ReportTypeEnum {
  BikeDamage = 'XE HƯ HỎNG',
  BikeDirty = 'XE BẨN',

  StationFull = 'TRẠM ĐẦY',
  StationNotAccepting = 'TRẠM KHÔNG NHẬN XE',
  StationOffline = 'TRẠM NGOẠI TUYẾN',

  SosAccident = 'CẤP CỨU TAI NẠN',
  SosHealth = 'CẤP CỨU SỨC KHỎE',
  SosThreat = 'CẤP CỨU NGUY HIỂM',
  Other = 'KHÁC'
}

export enum RentalStatus {
  Rented = 'ĐANG THUÊ',
  Completed = 'HOÀN THÀNH',
  Cancelled = 'ĐÃ HỦY',
  Reserved = 'ĐÃ ĐẶT TRƯỚC'
}

export enum GroupByOptions {
  Date = 'NGÀY',
  Month = 'THÁNG',
  Year = 'NĂM'
}

export enum ReservationStatus {
  Pending = 'ĐANG CHỜ XỬ LÍ',
  Active = 'ĐANG HOẠT ĐỘNG',
  Cancelled = 'ĐÃ HUỶ',
  Expired = 'ĐÃ HẾT HẠN'
}

export enum BikeStatus {
  Available = 'CÓ SẴN',
  Booked = 'ĐANG ĐƯỢC THUÊ',
  Broken = 'BỊ HỎNG',
  Reserved = 'ĐÃ ĐẶT TRƯỚC',
  Maintained = 'ĐANG BẢO TRÌ',
  Unavailable = 'KHÔNG CÓ SẴN'
}

export enum SupplierStatus {
  ACTIVE = 'HOẠT ĐỘNG',
  INACTIVE = 'NGƯNG HOẠT ĐỘNG',
  TERMINATE = 'CHẤM DỨT HỢP ĐỒNG'
}

export enum ReportPriority {
  LOW = '4 - THẤP',
  NORMAL = '3 - BÌNH THƯỜNG',
  HIGH = '2 - CAO',
  URGENT = '1 - KHẨN CẤP'
}

export enum PaymentStatus {
  Pending = 'ĐANG CHỜ XỬ LÝ',
  Success = 'THÀNH CÔNG',
  Failed = 'THẤT BẠI'
}

export enum PaymentMethod {
  Momo = 'MOMO',
  Bank = 'NGÂN HÀNG',
  Vnpt = 'VNPTMONEY',
  Wallet = 'VÍ'
}

export enum WalletStatus {
  Active = 'ĐANG HOẠT ĐỘNG',
  Frozen = 'ĐÃ BỊ ĐÓNG BĂNG'
}

export enum TransactionStaus {
  Pending = 'ĐANG CHỜ XỬ LÝ',
  Success = 'THÀNH CÔNG',
  Failed = 'THẤT BẠI',
  Cancelled = 'ĐÃ HỦY'
}

export enum TransactionTypeEnum {
  Deposit = 'NẠP TIỀN',
  PAYMENT = 'THANH TOÁN',
  DECREASE = 'TRỪ TIỀN',
  WithDrawal = 'RÚT TIỀN',
  Refund = 'HOÀN TIỀN',
  RESERVATION = 'ĐẶT TRUỚC'
}

export enum RefundStatus {
  Pending = 'ĐANG CHỜ XỬ LÝ',
  Approved = 'ĐÃ DUYỆT',
  Rejected = 'TỪ CHỐI',
  Completed = 'ĐÃ HOÀN THÀNH'
}

export enum WithDrawalStatus {
  Pending = 'ĐANG CHỜ XỬ LÝ',
  Approved = 'ĐÃ DUYỆT',
  Rejected = 'TỪ CHỐI',
  Completed = 'ĐÃ HOÀN THÀNH'
}

export enum RatingReasonTypeEnum {
  ISSUE = 'Vấn đề',
  COMPLIMENT = 'Khen ngợi'
}

export enum AppliesToEnum {
  Bike = 'bike',
  Station = 'station',
  App = 'app'
}

export enum TimeType {
  Hour = 'GIỜ',
  Minute = 'PHÚT',
  Second = 'GIÂY',
  Day = 'NGÀY'
}

export enum TrendValue {
  Up = 'Tăng',
  Down = 'Giảm',
  NoChange = 'Không đổi'
}

export enum SosAlertStatus {
  PENDING   = 'ĐANG CHỜ XỬ LÍ',
  ASSIGNED = 'ĐÃ GỬI NGƯỜI CỨU HỘ',
  EN_ROUTE = 'ĐANG TRÊN ĐƯỜNG ĐẾN',
  RESOLVED = 'ĐÃ XỬ LÍ',
  UNSOLVABLE = 'KHÔNG XỬ LÍ ĐƯỢC',
  REJECTED = 'ĐÃ TỪ CHỐI',
  CANCELLED = 'ĐÃ HUỶ'
}

export enum SummaryPeriodType {
  TODAY = 'HÔM NAY',
  THIS_MONTH = 'THÁNG NÀY'
}

export enum ReservationOptions {
  ONE_TIME = 'MỘT LẦN',
  FIXED_SLOT = 'KHUNG GIỜ CỐ ĐỊNH',
  SUBSCRIPTION = 'GÓI THÁNG'
}

export enum SubscriptionStatus {
  PENDING = 'ĐANG CHỜ XỬ LÍ',
  ACTIVE = 'ĐANG HOẠT ĐỘNG',
  EXPIRED = 'ĐÃ HẾT HẠN',
  CANCELLED = 'ĐÃ HUỶ'
}

export enum FixedSlotStatus {
  ACTIVE = 'ĐANG HOẠT ĐỘNG',
  PAUSED = 'TẠM DỪNG',
  CANCELLED = 'ĐÃ HUỶ'
}

export enum SubscriptionPackage {
  BASIC = 'basic',
  PREMIUM = 'premium',
  UNLIMITED = 'unlimited'
}
