import e from "cors";

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

export enum RentalStatus {
  Ongoing = "ĐANG THUÊ",
  Completed = "HOÀN THÀNH",
  Cancelled = "ĐÃ HỦY",
  Expired = "HẾT HẠN",
}

export enum PaymentStatus {
  Pending = "PENDING",
  Success = "SUCCESS",
  Failed = "FAILED",
}

export enum PaymentMethod {
  Momo = "MOMO",
  Bank = "BANK",
  Vnpt = "VNPTMONEY",
  Wallet = "WALLET",
}

export enum WalletStatus {
  Active = "ACTIVE",
  Frozen = "FROZEN",
}

export enum TransactionStaus {
  Pending = "PENDING",
  Success = "SUCCESS",
  Failed = "FAILED",
  Cancelled = "CANCELLED",
}

export enum TransactionTypeEnum {
  Deposit = "DEPOSIT",
  PAYMENT = "PAYMENT",
  WithDrawal = "WITHDRAWAL",
  Refund = "REFUND",
}
