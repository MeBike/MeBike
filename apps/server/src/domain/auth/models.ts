export type AccessTokenPayload = {
  userId: string;
  role: "USER" | "ADMIN" | "STAFF";
  verifyStatus: "UNVERIFIED" | "VERIFIED" | "BANNED";
  tokenType: "access";
};

export type RefreshTokenPayload = {
  userId: string;
  tokenType: "refresh";
  verifyStatus: "UNVERIFIED" | "VERIFIED" | "BANNED";
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
};
