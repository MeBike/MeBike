import { createRoute } from "@hono/zod-openapi";

import {
  AuthErrorCodeSchema,
  authErrorMessages,
  AuthErrorResponseSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
  RegisterRequestSchema,
  ResetPasswordRequestSchema,
  ResetPasswordTokenEnvelopeSchema,
  SendResetPasswordRequestSchema,
  SendVerifyEmailRequestSchema,
  TokensEnvelopeSchema,
  VerifyEmailOtpRequestSchema,
  VerifyResetPasswordOtpRequestSchema,
} from "../../auth/schemas";

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
          schema: RefreshRequestSchema.openapi("LogoutRequest"),
        },
      },
    },
  },
  responses: {
    200: { description: "Logged out" },
    401: {
      description: "Invalid refresh token",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
          examples: {
            InvalidRefreshToken: {
              value: {
                error: authErrorMessages.INVALID_REFRESH_TOKEN,
                details: { code: AuthErrorCodeSchema.enum.INVALID_REFRESH_TOKEN },
              },
            },
          },
        },
      },
    },
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
                details: {
                  code: AuthErrorCodeSchema.enum.INVALID_OTP,
                  retriable: true,
                },
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
    200: {
      description: "Password reset",
      content: {
        "application/json": { schema: TokensEnvelopeSchema },
      },
    },
    400: {
      description: "Invalid or expired reset token",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
          examples: {
            InvalidResetToken: {
              value: {
                error: authErrorMessages.INVALID_RESET_TOKEN,
                details: { code: AuthErrorCodeSchema.enum.INVALID_RESET_TOKEN },
              },
            },
          },
        },
      },
    },
  },
});

export const verifyResetPasswordOtpRoute = createRoute({
  method: "post",
  path: "/v1/auth/password/reset/verify-otp",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: VerifyResetPasswordOtpRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP verified for password reset",
      content: {
        "application/json": { schema: ResetPasswordTokenEnvelopeSchema },
      },
    },
    400: {
      description: "Invalid or expired OTP",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
          examples: {
            InvalidOtp: {
              value: {
                error: "Invalid or expired OTP",
                details: {
                  code: AuthErrorCodeSchema.enum.INVALID_OTP,
                  retriable: false,
                },
              },
            },
          },
        },
      },
    },
  },
});
