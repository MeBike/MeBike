import { createRoute, z } from "@hono/zod-openapi";

import type {
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendResetPasswordRequest,
  SendVerifyEmailRequest,
  Tokens,
  VerifyEmailOtpRequest,
} from "./models";

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
  phoneNumber: z.string().optional().nullable(),
}).openapi("RegisterRequest") satisfies z.ZodType<RegisterRequest>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
}).openapi("RefreshRequest") satisfies z.ZodType<RefreshRequest>;

export const SendVerifyEmailRequestSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
}).openapi("SendVerifyEmailRequest") satisfies z.ZodType<SendVerifyEmailRequest>;

export const VerifyEmailOtpRequestSchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().min(1),
}).openapi("VerifyEmailOtpRequest") satisfies z.ZodType<VerifyEmailOtpRequest>;

export const SendResetPasswordRequestSchema = z.object({
  email: z.string().email(),
}).openapi("SendResetPasswordRequest") satisfies z.ZodType<SendResetPasswordRequest>;

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1),
  newPassword: z.string().min(1),
}).openapi("ResetPasswordRequest") satisfies z.ZodType<ResetPasswordRequest>;

export const AuthErrorCodeSchema = z.enum([
  "INVALID_CREDENTIALS",
  "INVALID_REFRESH_TOKEN",
  "INVALID_OTP",
  "DUPLICATE_EMAIL",
  "DUPLICATE_PHONE_NUMBER",
]).openapi("AuthErrorCode");

export const AuthErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: AuthErrorCodeSchema,
    issues: z.array(z.any()).optional(),
  }),
}).openapi("AuthErrorResponse");

export const authErrorMessages = {
  INVALID_CREDENTIALS: "Invalid credentials",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  INVALID_OTP: "Invalid or expired OTP",
  DUPLICATE_EMAIL: "Email already in use",
  DUPLICATE_PHONE_NUMBER: "Phone number already in use",
} as const;

export const registerRoute = createRoute({
  method: "post",
  path: "/v1/auth/register",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Registered",
      content: {
        "application/json": { schema: TokensEnvelopeSchema },
      },
    },
    409: {
      description: "Duplicate email or phone number",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
          examples: {
            DuplicateEmail: {
              value: {
                error: authErrorMessages.DUPLICATE_EMAIL,
                details: { code: AuthErrorCodeSchema.enum.DUPLICATE_EMAIL },
              },
            },
            DuplicatePhone: {
              value: {
                error: authErrorMessages.DUPLICATE_PHONE_NUMBER,
                details: { code: AuthErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
              },
            },
          },
        },
      },
    },
  },
});

export const loginRoute = createRoute({
  method: "post",
  path: "/v1/auth/login",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": { schema: TokensEnvelopeSchema },
      },
    },
    401: {
      description: "Invalid credentials",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
          examples: {
            InvalidCredentials: {
              value: {
                error: "Invalid credentials",
                details: { code: AuthErrorCodeSchema.enum.INVALID_CREDENTIALS },
              },
            },
          },
        },
      },
    },
  },
});

export const refreshRoute = createRoute({
  method: "post",
  path: "/v1/auth/refresh",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RefreshRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Tokens refreshed",
      content: {
        "application/json": { schema: TokensEnvelopeSchema },
      },
    },
    401: {
      description: "Invalid refresh token",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
          examples: {
            InvalidRefreshToken: {
              value: {
                error: "Invalid refresh token",
                details: { code: AuthErrorCodeSchema.enum.INVALID_REFRESH_TOKEN },
              },
            },
          },
        },
      },
    },
  },
});

export const logoutRoute = createRoute({
  method: "post",
  path: "/v1/auth/logout",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string().min(1),
          }).openapi("LogoutRequest"),
        },
      },
    },
  },
  responses: {
    200: { description: "Logged out" },
  },
});

export const logoutAllRoute = createRoute({
  method: "post",
  path: "/v1/auth/logout-all",
  tags: ["Auth"],
  responses: {
    200: { description: "Logged out all sessions" },
  },
});

export const sendVerifyEmailRoute = createRoute({
  method: "post",
  path: "/v1/auth/verify-email/send",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SendVerifyEmailRequestSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Verification email sent" },
  },
});

export const resendVerifyEmailRoute = createRoute({
  method: "post",
  path: "/v1/auth/verify-email/resend",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SendVerifyEmailRequestSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Verification email resent" },
  },
});

export const verifyEmailOtpRoute = createRoute({
  method: "post",
  path: "/v1/auth/verify-email/otp",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: VerifyEmailOtpRequestSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Email verified" },
    400: {
      description: "Invalid or expired OTP",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
          examples: {
            InvalidOtp: {
              value: {
                error: "Invalid or expired OTP",
                details: { code: AuthErrorCodeSchema.enum.INVALID_OTP },
              },
            },
          },
        },
      },
    },
  },
});

export const sendResetPasswordRoute = createRoute({
  method: "post",
  path: "/v1/auth/password/reset/send",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SendResetPasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Password reset email sent (if user exists)" },
  },
});

export const resetPasswordRoute = createRoute({
  method: "post",
  path: "/v1/auth/password/reset/confirm",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ResetPasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Password reset" },
    400: {
      description: "Invalid or expired OTP",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
          examples: {
            InvalidOtp: {
              value: {
                error: "Invalid or expired OTP",
                details: { code: AuthErrorCodeSchema.enum.INVALID_OTP },
              },
            },
          },
        },
      },
    },
  },
});

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
