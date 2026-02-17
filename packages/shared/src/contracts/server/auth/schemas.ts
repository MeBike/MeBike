import { z } from "@hono/zod-openapi";

import type {
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendResetPasswordRequest,
  SendVerifyEmailRequest,
  Tokens,
  VerifyEmailOtpRequest,
  VerifyResetPasswordOtpRequest,
} from "./models";

import { OptionalTrimmedNullableStringSchema } from "../schemas";

export const TokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
}).openapi("Tokens") satisfies z.ZodType<Tokens>;

export const TokensEnvelopeSchema = z.object({
  data: TokensSchema,
}).openapi("TokensEnvelope");

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
}).openapi("LoginRequest") satisfies z.ZodType<LoginRequest>;

export const RegisterRequestSchema = z.object({
  fullname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  phoneNumber: OptionalTrimmedNullableStringSchema,
}).openapi("RegisterRequest") satisfies z.ZodType<RegisterRequest>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
}).openapi("RefreshRequest") satisfies z.ZodType<RefreshRequest>;

export const SendVerifyEmailRequestSchema = z.object({
  userId: z.uuidv7(),
  email: z.string().email(),
  fullName: z.string().min(1),
}).openapi("SendVerifyEmailRequest") satisfies z.ZodType<SendVerifyEmailRequest>;

export const VerifyEmailOtpRequestSchema = z.object({
  userId: z.uuidv7(),
  otp: z.string().min(1),
}).openapi("VerifyEmailOtpRequest") satisfies z.ZodType<VerifyEmailOtpRequest>;

export const SendResetPasswordRequestSchema = z.object({
  email: z.string().email(),
}).openapi("SendResetPasswordRequest") satisfies z.ZodType<SendResetPasswordRequest>;

export const ResetPasswordRequestSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(1),
}).openapi("ResetPasswordRequest") satisfies z.ZodType<ResetPasswordRequest>;

export const VerifyResetPasswordOtpRequestSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1),
}).openapi("VerifyResetPasswordOtpRequest") satisfies z.ZodType<VerifyResetPasswordOtpRequest>;

export const ResetPasswordTokenEnvelopeSchema = z.object({
  data: z.object({
    resetToken: z.string(),
  }),
}).openapi("ResetPasswordTokenEnvelope");

export const AuthErrorCodeSchema = z.enum([
  "INVALID_CREDENTIALS",
  "INVALID_REFRESH_TOKEN",
  "INVALID_OTP",
  "INVALID_RESET_TOKEN",
  "DUPLICATE_EMAIL",
  "DUPLICATE_PHONE_NUMBER",
]).openapi("AuthErrorCode");

export const AuthErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: AuthErrorCodeSchema,
    retriable: z.boolean().optional(),
    issues: z.array(z.any()).optional(),
  }),
}).openapi("AuthErrorResponse");

export const authErrorMessages = {
  INVALID_CREDENTIALS: "Invalid credentials",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  INVALID_OTP: "Invalid or expired OTP",
  INVALID_RESET_TOKEN: "Invalid or expired reset token",
  DUPLICATE_EMAIL: "Email already in use",
  DUPLICATE_PHONE_NUMBER: "Phone number already in use",
} as const;
