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
  Admin = 'ADMIN'
}

export enum ReportStatus {
  Pending = 'ĐANG CHỜ XỬ LÝ',
  InProgress = 'ĐANG XỬ LÝ',
  Resolved = 'ĐÃ GIẢI QUYẾT',
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
  Rented = "ĐANG THUÊ",
  Completed = "HOÀN THÀNH",
  Cancelled = "ĐÃ HỦY",
  Reserved = "ĐÃ ĐẶT TRƯỚC",
}

export enum GroupByOptions {
  Day = "DAY",
  Month = "MONTH",
  Year = "YEAR",
}

export enum ReservationStatus {
  Pending = "ĐANG CHỜ XỬ LÍ",
  Active = "ĐANG HOẠT ĐỘNG",
  Cancelled = "ĐÃ HUỶ",
  Expired = "ĐÃ HẾT HẠN",
}

export enum BikeStatus {
  Available = "CÓ SẴN",
  Booked = "ĐANG ĐƯỢC THUÊ",
  Broken = "BỊ HỎNG",
  Reserved = "ĐÃ ĐẶT TRƯỚC",
  Maintained = "ĐANG BẢO TRÌ",
  Unavailable = "KHÔNG CÓ SẴN",
}

export enum SupplierStatus {
  ACTIVE = 'HOẠT ĐỘNG',
  INACTIVE = 'NGƯNG HOẠT ĐỘNG',
  TERMINATE = 'CHẤM DỨT HỢP ĐỒNG'
}

export enum ReportPriority {
  LOW = 'THẤP',
  NORMAL = 'BÌNH THƯỜNG',
  HIGH = 'CAO',
  URGENT = 'KHẨN CẤP'
}

export enum PaymentStatus {
  Pending = 'PENDING',
  Success = 'SUCCESS',
  Failed = 'FAILED'
}

export enum PaymentMethod {
  Momo = 'MOMO',
  Bank = 'BANK',
  Vnpt = 'VNPTMONEY',
  Wallet = 'WALLET'
}

export enum WalletStatus {
  Active = 'ACTIVE',
  Frozen = 'FROZEN'
}

export enum TransactionStaus {
  Pending = 'PENDING',
  Success = 'SUCCESS',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED'
}

export enum TransactionTypeEnum {
  Deposit = 'DEPOSIT',
  PAYMENT = 'PAYMENT',
  WithDrawal = 'WITHDRAWAL',
  Refund = 'REFUND'
}

export enum RefundStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Completed = 'COMPLETED'
}

export enum WithDrawalStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Completed = 'COMPLETED'
}
