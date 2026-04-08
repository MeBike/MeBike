export type AccessTokenPayload = {
  userId: string;
  role: "USER" | "STAFF" | "TECHNICIAN" | "MANAGER" | "ADMIN" | "AGENCY";
  accountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
  verifyStatus: "UNVERIFIED" | "VERIFIED";
  agencyId?: string;
  operatorStationId?: string;
  tokenType: "access";
};

export type RefreshTokenPayload = {
  userId: string;
  tokenType: "refresh";
  accountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
  verifyStatus: "UNVERIFIED" | "VERIFIED";
  jti?: string;
};

export type RefreshSession = {
  sessionId: string;
  userId: string;
  refreshToken: string;
  issuedAt: Date;
  expiresAt: Date;
};

export type EmailOtpKind = "verify-email" | "reset-password";

export type EmailOtpRecord = {
  userId: string;
  email: string;
  kind: EmailOtpKind;
  otp: string;
  expiresAt: Date;
  attemptsRemaining?: number;
};

export type ResetPasswordTokenRecord = {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
};
