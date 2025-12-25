import type { UnauthorizedErrorResponse } from "@mebike/shared";

import { AuthContracts, serverRoutes, UnauthorizedErrorCodeSchema, unauthorizedErrorMessages } from "@mebike/shared";
import { Effect, Match } from "effect";

import { AuthServiceTag } from "@/domain/auth";
import { registerUseCase } from "@/domain/auth/use-cases/auth.use-cases";
import { withLoggedCause } from "@/domain/shared";
import { withAuthDeps } from "@/http/shared/providers";

export function registerAuthRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const auth = serverRoutes.auth;
  const { authErrorMessages } = AuthContracts;

  app.openapi(auth.register, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(withAuthDeps(registerUseCase(body)), "POST /v1/auth/register");

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    if (result._tag === "Right") {
      return c.json<{ data: AuthContracts.Tokens }, 201>({ data: result.right }, 201);
    }

    return Match.value(result.left).pipe(
      Match.tag("DuplicateUserEmail", () =>
        c.json<AuthContracts.AuthErrorResponse, 409>({
          error: authErrorMessages.DUPLICATE_EMAIL,
          details: { code: AuthContracts.AuthErrorCodeSchema.enum.DUPLICATE_EMAIL },
        }, 409)),
      Match.tag("DuplicateUserPhoneNumber", () =>
        c.json<AuthContracts.AuthErrorResponse, 409>({
          error: authErrorMessages.DUPLICATE_PHONE_NUMBER,
          details: { code: AuthContracts.AuthErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
        }, 409)),
      Match.orElse((left) => {
        throw left;
      }),
    );
  });

  app.openapi(auth.login, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withAuthDeps(Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.loginWithPassword(body);
      })),
      "POST /v1/auth/login",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    if (result._tag === "Right") {
      return c.json<{ data: AuthContracts.Tokens }, 200>({ data: result.right }, 200);
    }

    return Match.value(result.left).pipe(
      Match.tag("InvalidCredentials", () =>
        c.json<AuthContracts.AuthErrorResponse, 401>({
          error: authErrorMessages.INVALID_CREDENTIALS,
          details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_CREDENTIALS },
        }, 401)),
      Match.orElse(() =>
        c.json<AuthContracts.AuthErrorResponse, 401>({
          error: authErrorMessages.INVALID_CREDENTIALS,
          details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_CREDENTIALS },
        }, 401)),
    );
  });

  app.openapi(auth.refresh, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withAuthDeps(Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.refreshTokens(body);
      })),
      "POST /v1/auth/refresh",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    if (result._tag === "Right") {
      return c.json<{ data: AuthContracts.Tokens }, 200>({ data: result.right }, 200);
    }

    return Match.value(result.left).pipe(
      Match.tag("InvalidRefreshToken", () =>
        c.json<AuthContracts.AuthErrorResponse, 401>({
          error: authErrorMessages.INVALID_REFRESH_TOKEN,
          details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_REFRESH_TOKEN },
        }, 401)),
      Match.orElse(() =>
        c.json<AuthContracts.AuthErrorResponse, 401>({
          error: authErrorMessages.INVALID_REFRESH_TOKEN,
          details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_REFRESH_TOKEN },
        }, 401)),
    );
  });

  app.openapi(auth.logout, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withAuthDeps(Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.logout(body);
      })),
      "POST /v1/auth/logout",
    ).pipe(Effect.orDie);
    await Effect.runPromise(eff);
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.logoutAll, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json<UnauthorizedErrorResponse, 401>({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const eff = withLoggedCause(
      withAuthDeps(Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.logoutAll({ userId });
      })),
      "POST /v1/auth/logout-all",
    ).pipe(Effect.orDie);
    await Effect.runPromise(eff);
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.sendVerifyEmail, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withAuthDeps(Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.sendVerifyEmail(body);
      })),
      "POST /v1/auth/verify-email/send",
    ).pipe(Effect.orDie);
    await Effect.runPromise(eff);
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.resendVerifyEmail, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withAuthDeps(Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.sendVerifyEmail(body);
      })),
      "POST /v1/auth/verify-email/resend",
    ).pipe(Effect.orDie);
    await Effect.runPromise(eff);
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.verifyEmailOtp, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withAuthDeps(Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyEmailOtp(body);
      })),
      "POST /v1/auth/verify-email/otp",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    if (result._tag === "Right") {
      return c.json<undefined, 200>(undefined, 200);
    }

    return c.json<AuthContracts.AuthErrorResponse, 400>({
      error: authErrorMessages.INVALID_OTP,
      details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_OTP },
    }, 400);
  });

  app.openapi(auth.sendResetPassword, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withAuthDeps(Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.sendResetPassword(body);
      })),
      "POST /v1/auth/password/reset/send",
    ).pipe(Effect.orDie);
    await Effect.runPromise(eff);
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.resetPassword, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withAuthDeps(Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.resetPassword(body);
      })),
      "POST /v1/auth/password/reset/confirm",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    if (result._tag === "Right") {
      return c.json<undefined, 200>(undefined, 200);
    }

    return c.json<AuthContracts.AuthErrorResponse, 400>({
      error: authErrorMessages.INVALID_OTP,
      details: { code: AuthContracts.AuthErrorCodeSchema.enum.INVALID_OTP },
    }, 400);
  });
}
