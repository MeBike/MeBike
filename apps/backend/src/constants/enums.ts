export enum UserVerifyStatus {
  Unverified = "UNVERIFIED",
  Verified = "VERIFIED",
  Banned = "BANNED",
}

export enum TokenType {
  AccessToken = "ACCESS_TOKEN",
  RefreshToken = "REFRESH_TOKEN",
  ForgotPasswordToken = "FORGOT_PASSWORD_TOKEN",
  EmailVerificationToken = "EMAIL_VERIFICATION_TOKEN",
}

export enum Role {
  User = "USER",
  Staff = "STAFF",
  Admin = "ADMIN",
}

export enum ReportStatus {
  Pending = "ĐANG CHỜ XỬ LÝ",
  InProgress = "ĐANG XỬ LÝ",
  Resolved = "ĐÃ GIẢI QUYẾT",
  Cancel = "ĐÃ HỦY",
}

export enum ReportTypeEnum {
  BikeDamage = "XE HƯ HỎNG",
  BikeDirty = "XE BẨN",

  StationFull = "TRẠM ĐẦY",
  StationNotAccepting = "TRẠM KHÔNG NHẬN XE",
  StationOffline = "TRẠM NGOẠI TUYẾN",

  SosAccident = "CẤP CỨU TAI NẠN",
  SosHealth = "CẤP CỨU SỨC KHỎE",
  SosThreat = "CẤP CỨU NGUY HIỂM",
  Other = "KHÁC",
}

export enum BikeStatus {
  Available = "SẴN SÀNG",
  Booked = "ĐÃ ĐẶT",
  Broken = "HƯ HỎNG",
  Reserved = "ĐÃ ĐƯỢC ĐẶT TRƯỚC",
  Maintained = "ĐANG ĐƯỢC BẢO TRÌ",
  Unavailable = "KHÔNG SẴN SÀNG",
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
  Available = "AVAILABLE", // Có sẵn
  Booked = "BOOKED", // Đã được thuê / Đang sử dụng
  Broken = "BROKEN", // Bị hỏng
  Reserved = "RESERVED", // Đã được đặt trước
  Maintained = "MAINTAINED", // Đang bảo trì
  Unavailable = "UNAVAILABLE", // Không có sẵn (trong kho)
}

export enum SupplierStatus {
  ACTIVE = "HOẠT ĐỘNG",
  INACTIVE = "NGƯNG HOẠT ĐỘNG",
  TERMINATE = "CHẤM DỨT HỢP ĐỒNG",
}

export enum ReportPriority {
  LOW = "THẤP",
  NORMAL = "BÌNH THƯỜNG",
  HIGH = "CAO",
  URGENT = "KHẨN CẤP",
}
