import {
  loginRoute,
  logoutAllRoute,
  logoutRoute,
  refreshRoute,
  registerRoute,
  resendVerifyEmailRoute,
  resetPasswordRoute,
  sendResetPasswordRoute,
  sendVerifyEmailRoute,
  verifyEmailOtpRoute,
} from "./mutations";

export * from "../../auth/schemas";
export * from "./mutations";

export const authRoutes = {
  register: registerRoute,
  login: loginRoute,
  refresh: refreshRoute,
  logout: logoutRoute,
  logoutAll: logoutAllRoute,
  sendVerifyEmail: sendVerifyEmailRoute,
  resendVerifyEmail: resendVerifyEmailRoute,
  verifyEmailOtp: verifyEmailOtpRoute,
  sendResetPassword: sendResetPasswordRoute,
  resetPassword: resetPasswordRoute,
} as const;
