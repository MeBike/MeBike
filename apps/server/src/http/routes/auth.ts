import { AuthContracts, serverRoutes } from "@mebike/shared";
import { Effect, Match } from "effect";

import {
  loginWithPasswordUseCase,
  logoutUseCase,
  refreshTokensUseCase,
  registerUseCase,
  resendVerifyEmailUseCase,
  resetPasswordUseCase,
  sendResetPasswordUseCase,
  sendVerifyEmailUseCase,
  verifyEmailOtpUseCase,
} from "@/domain/auth/use-cases/auth.use-cases";
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
      Match.orElse(() =>
        c.json<AuthContracts.AuthErrorResponse, 409>({
          error: authErrorMessages.DUPLICATE_EMAIL,
          details: { code: AuthContracts.AuthErrorCodeSchema.enum.DUPLICATE_EMAIL },
        }, 409)),
    );
  });

  app.openapi(auth.login, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(withAuthDeps(loginWithPasswordUseCase(body)), "POST /v1/auth/login");

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
    const eff = withLoggedCause(withAuthDeps(refreshTokensUseCase(body)), "POST /v1/auth/refresh");

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
    const eff = withLoggedCause(withAuthDeps(logoutUseCase(body)), "POST /v1/auth/logout").pipe(
      Effect.orDie,
    );
    await Effect.runPromise(eff);
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.logoutAll, async (c) => {
    // TODO: wire to auth middleware once we have CurrentUser and call logoutAllUseCase.
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.sendVerifyEmail, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(withAuthDeps(sendVerifyEmailUseCase(body)), "POST /v1/auth/verify-email/send").pipe(
      Effect.orDie,
    );
    await Effect.runPromise(eff);
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.resendVerifyEmail, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(withAuthDeps(resendVerifyEmailUseCase(body)), "POST /v1/auth/verify-email/resend").pipe(
      Effect.orDie,
    );
    await Effect.runPromise(eff);
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.verifyEmailOtp, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(withAuthDeps(verifyEmailOtpUseCase(body)), "POST /v1/auth/verify-email/otp");

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
      withAuthDeps(sendResetPasswordUseCase(body)),
      "POST /v1/auth/password/reset/send",
    ).pipe(Effect.orDie);
    await Effect.runPromise(eff);
    return c.json<undefined, 200>(undefined, 200);
  });

  app.openapi(auth.resetPassword, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withAuthDeps(resetPasswordUseCase(body)),
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
