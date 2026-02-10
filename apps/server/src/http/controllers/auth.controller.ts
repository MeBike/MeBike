import type { RouteHandler } from "@hono/zod-openapi";
import type { UnauthorizedErrorResponse } from "@mebike/shared";

import {
  AuthContracts,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { AuthServiceTag } from "@/domain/auth";
import { registerUseCase } from "@/domain/auth/services/register.service";
import { withLoggedCause } from "@/domain/shared";

type AuthRoutes = typeof import("@mebike/shared")["serverRoutes"]["auth"];

const register: RouteHandler<AuthRoutes["register"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(registerUseCase(body), "POST /v1/auth/register");

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<{ data: AuthContracts.Tokens }, 201>({ data: result.right }, 201);
  }

  return Match.value(result.left).pipe(
    Match.tag("DuplicateUserEmail", () =>
      c.json<AuthContracts.AuthErrorResponse, 409>({
        error: AuthContracts.authErrorMessages.DUPLICATE_EMAIL,
        details: { code: AuthContracts.AuthErrorCodeSchema.enum.DUPLICATE_EMAIL },
      }, 409)),
    Match.tag("DuplicateUserPhoneNumber", () =>
      c.json<AuthContracts.AuthErrorResponse, 409>({
        error: AuthContracts.authErrorMessages.DUPLICATE_PHONE_NUMBER,
        details: { code: AuthContracts.AuthErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
      }, 409)),
    Match.orElse((left) => {
      throw left;
    }),
  );
};

const login: RouteHandler<AuthRoutes["login"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AuthServiceTag;
      return yield* service.loginWithPassword(body);
    }),
    "POST /v1/auth/login",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<{ data: AuthContracts.Tokens }, 200>({ data: result.right }, 200);
  }

  return Match.value(result.left).pipe(
    Match.tag("InvalidCredentials", () =>
      c.json<AuthContracts.AuthErrorResponse, 401>({
        error: AuthContracts.authErrorMessages.INVALID_CREDENTIALS,
        details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_CREDENTIALS },
      }, 401)),
    Match.orElse(() =>
      c.json<AuthContracts.AuthErrorResponse, 401>({
        error: AuthContracts.authErrorMessages.INVALID_CREDENTIALS,
        details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_CREDENTIALS },
      }, 401)),
  );
};

const refresh: RouteHandler<AuthRoutes["refresh"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AuthServiceTag;
      return yield* service.refreshTokens(body);
    }),
    "POST /v1/auth/refresh",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<{ data: AuthContracts.Tokens }, 200>({ data: result.right }, 200);
  }

  return Match.value(result.left).pipe(
    Match.tag("InvalidRefreshToken", () =>
      c.json<AuthContracts.AuthErrorResponse, 401>({
        error: AuthContracts.authErrorMessages.INVALID_REFRESH_TOKEN,
        details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_REFRESH_TOKEN },
      }, 401)),
    Match.orElse(() =>
      c.json<AuthContracts.AuthErrorResponse, 401>({
        error: AuthContracts.authErrorMessages.INVALID_REFRESH_TOKEN,
        details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_REFRESH_TOKEN },
      }, 401)),
  );
};

const logout: RouteHandler<AuthRoutes["logout"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AuthServiceTag;
      return yield* service.logout({ refreshToken: body.refreshToken });
    }),
    "POST /v1/auth/logout",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", () => c.json<undefined, 200>(undefined, 200)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("InvalidRefreshToken", () =>
        c.json<AuthContracts.AuthErrorResponse, 401>({
          error: AuthContracts.authErrorMessages.INVALID_REFRESH_TOKEN,
          details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_REFRESH_TOKEN },
        }, 401)),
      Match.orElse((err) => {
        throw err;
      }),
    )),
    Match.exhaustive,
  );
};

const logoutAll: RouteHandler<AuthRoutes["logoutAll"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json<UnauthorizedErrorResponse, 401>({
      error: unauthorizedErrorMessages.UNAUTHORIZED,
      details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
    }, 401);
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AuthServiceTag;
      return yield* service.logoutAll({ userId });
    }),
    "POST /v1/auth/logout-all",
  ).pipe(Effect.orDie);
  await c.var.runPromise(eff);
  return c.json<undefined, 200>(undefined, 200);
};

const sendVerifyEmail: RouteHandler<AuthRoutes["sendVerifyEmail"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AuthServiceTag;
      return yield* service.sendVerifyEmail(body);
    }),
    "POST /v1/auth/verify-email/send",
  ).pipe(Effect.orDie);
  await c.var.runPromise(eff);
  return c.json<undefined, 200>(undefined, 200);
};

const resendVerifyEmail: RouteHandler<AuthRoutes["resendVerifyEmail"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AuthServiceTag;
      return yield* service.sendVerifyEmail(body);
    }),
    "POST /v1/auth/verify-email/resend",
  ).pipe(Effect.orDie);
  await c.var.runPromise(eff);
  return c.json<undefined, 200>(undefined, 200);
};

const verifyEmailOtp: RouteHandler<AuthRoutes["verifyEmailOtp"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AuthServiceTag;
      return yield* service.verifyEmailOtp(body);
    }),
    "POST /v1/auth/verify-email/otp",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<undefined, 200>(undefined, 200);
  }

  return c.json<AuthContracts.AuthErrorResponse, 400>({
    error: AuthContracts.authErrorMessages.INVALID_OTP,
    details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_OTP },
  }, 400);
};

const sendResetPassword: RouteHandler<AuthRoutes["sendResetPassword"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AuthServiceTag;
      return yield* service.sendResetPassword(body);
    }),
    "POST /v1/auth/password/reset/send",
  ).pipe(Effect.orDie);
  await c.var.runPromise(eff);
  return c.json<undefined, 200>(undefined, 200);
};

const resetPassword: RouteHandler<AuthRoutes["resetPassword"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AuthServiceTag;
      return yield* service.resetPassword(body);
    }),
    "POST /v1/auth/password/reset/confirm",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<undefined, 200>(undefined, 200);
  }

  return c.json<AuthContracts.AuthErrorResponse, 400>({
    error: AuthContracts.authErrorMessages.INVALID_OTP,
    details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_OTP },
  }, 400);
};

export const AuthController = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  sendVerifyEmail,
  resendVerifyEmail,
  verifyEmailOtp,
  sendResetPassword,
  resetPassword,
} as const;
