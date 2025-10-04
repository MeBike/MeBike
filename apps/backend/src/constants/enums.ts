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
  Pending = "PENDING",
  InProgress = "IN_PROGRESS",
  Resolved = "RESOLVED",
  Cancel = "Cancel",
}

export enum ReportTypeEnum {
  BikeDamage = "BIKE_DAMAGE",
  BikeDirty = "BIKE_DIRTY",

  StationFull = "STATION_FULL",
  StationNotAccepting = "STATION_NOT_ACCEPTING",
  StationOffline = "STATION_OFFLINE",

  SosAccident = "SOS_ACCIDENT",
  SosHealth = "SOS_HEALTH",
  SosThreat = "SOS_THREAT",
  Other = "OTHER",
}

export enum RentalStatus {
  Ongoing = "ONGOING",
  Completed = "COMPLETED",
  Cancelled = "CANCELLED",
  Expired = "EXPIRED",
}
