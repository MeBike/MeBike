import { Effect } from "effect";

import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
} from "@/domain/users";

import type {
  AuthFailure,
  InvalidOtp,
} from "../domain-errors";
import type { Tokens } from "../jwt";

import { AuthServiceTag } from "../services/auth.service";

export function registerUseCase(args: {
  fullname: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
}): Effect.Effect<
  Tokens,
  DuplicateUserEmail | DuplicateUserPhoneNumber,
  AuthServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.register(args);
  });
}

export function loginWithPasswordUseCase(args: {
  email: string;
  password: string;
}): Effect.Effect<Tokens, AuthFailure, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.loginWithPassword(args);
  });
}

export function refreshTokensUseCase(args: {
  refreshToken: string;
}): Effect.Effect<Tokens, AuthFailure, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.refreshTokens(args);
  });
}

export function logoutUseCase(args: {
  sessionId: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.logout(args);
  });
}

export function logoutAllUseCase(args: {
  userId: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.logoutAll(args);
  });
}

export function sendVerifyEmailUseCase(args: {
  userId: string;
  email: string;
  fullName: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.sendVerifyEmail(args);
  });
}

export function resendVerifyEmailUseCase(args: {
  userId: string;
  email: string;
  fullName: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  // reuse existing use case ALSO NO RATELIMIT HERE TODO ADD IT LATER
  return sendVerifyEmailUseCase(args);
}

export function verifyEmailOtpUseCase(args: {
  userId: string;
  otp: string;
}): Effect.Effect<void, InvalidOtp, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.verifyEmailOtp(args);
  });
}

export function sendResetPasswordUseCase(args: {
  email: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.sendResetPassword(args);
  });
}

export function resetPasswordUseCase(args: {
  email: string;
  otp: string;
  newPassword: string;
}): Effect.Effect<void, InvalidOtp, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.resetPassword(args);
  });
}
