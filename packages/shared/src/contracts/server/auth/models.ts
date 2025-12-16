export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullname: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type SendVerifyEmailRequest = {
  userId: string;
  email: string;
  fullName: string;
};

export type VerifyEmailOtpRequest = {
  userId: string;
  otp: string;
};

export type SendResetPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  otp: string;
  newPassword: string;
};
