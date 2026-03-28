import type { Either } from "effect";

import bcrypt from "bcrypt";
import { Effect, Option } from "effect";
import jwt from "jsonwebtoken";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { setupRedisIntFixture } from "@/test/redis/redis-int-fixture";

import { OTP_MAX_ATTEMPTS } from "../../config";
import { makeAuthTestKit } from "./auth-test-kit";

function expectInvalidOtp(result: Either.Either<unknown, { _tag: string; retriable?: boolean }>) {
  const error = expectLeftTag(result, "InvalidOtp") as { _tag: "InvalidOtp"; retriable: boolean };
  return error;
}

function expectInvalidResetToken(result: Either.Either<unknown, { _tag: string }>) {
  expectLeftTag(result, "InvalidResetToken");
}

function decodeSessionId(refreshToken: string) {
  const payload = jwt.decode(refreshToken) as jwt.JwtPayload | null;
  const sessionId = payload?.jti;
  if (typeof sessionId !== "string") {
    throw new TypeError("Missing session id in refresh token");
  }
  return sessionId;
}

describe("authService Integration", () => {
  const fixture = setupPrismaIntFixture();
  const redis = setupRedisIntFixture();
  let auth: ReturnType<typeof makeAuthTestKit>;

  beforeAll(async () => {
    auth = makeAuthTestKit({
      prisma: fixture.prisma,
      redisClient: redis.client,
    });
  }, 60000);

  const createUser = (args: {
    email: string;
    password: string;
    verify?: "UNVERIFIED" | "VERIFIED";
    accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
  }) => auth.createUser(args);
  const loginWithPassword = (args: { email: string; password: string }) =>
    auth.run(service => service.loginWithPassword(args));
  const loginWithPasswordEither = (args: { email: string; password: string }) =>
    auth.runEither(service => service.loginWithPassword(args));
  const refreshTokens = (args: { refreshToken: string }) =>
    auth.run(service => service.refreshTokens(args));
  const refreshTokensEither = (args: { refreshToken: string }) =>
    auth.runEither(service => service.refreshTokens(args));
  const logout = (args: { refreshToken: string }) =>
    auth.run(service => service.logout(args));
  const logoutAll = (args: { userId: string }) =>
    auth.run(service => service.logoutAll(args));
  const verifyEmailOtp = (args: { userId: string; otp: string }) =>
    auth.run(service => service.verifyEmailOtp(args));
  const verifyEmailOtpEither = (args: { userId: string; otp: string }) =>
    auth.runEither(service => service.verifyEmailOtp(args));
  const verifyResetPasswordOtp = (args: { email: string; otp: string }) =>
    auth.run(service => service.verifyResetPasswordOtp(args));
  const verifyResetPasswordOtpEither = (args: { email: string; otp: string }) =>
    auth.runEither(service => service.verifyResetPasswordOtp(args));
  const resetPassword = (args: { resetToken: string; newPassword: string }) =>
    auth.run(service => service.resetPassword(args));
  const resetPasswordEither = (args: { resetToken: string; newPassword: string }) =>
    auth.runEither(service => service.resetPassword(args));

  it("loginWithPassword creates tokens and session", async () => {
    const { email } = await createUser({
      email: "login@example.com",
      password: "Password123!",
    });

    const tokens = await loginWithPassword({
      email,
      password: "Password123!",
    });

    const sessionId = decodeSessionId(tokens.refreshToken);
    const sessionOpt = await Effect.runPromise(auth.authRepo.getSession(sessionId));

    expect(Option.isSome(sessionOpt)).toBe(true);
  });

  it("loginWithPassword rejects invalid credentials", async () => {
    const { email } = await createUser({
      email: "invalid@example.com",
      password: "Password123!",
    });

    const result = await loginWithPasswordEither({ email, password: "wrong" });

    expectLeftTag(result, "InvalidCredentials");
  });

  it("loginWithPassword rejects banned users", async () => {
    const { email } = await createUser({
      email: "banned@example.com",
      password: "Password123!",
      accountStatus: "BANNED",
    });

    const result = await loginWithPasswordEither({
      email,
      password: "Password123!",
    });

    expectLeftTag(result, "InvalidCredentials");
  });

  it("refreshTokens issues new tokens and invalidates old session", async () => {
    const { email } = await createUser({
      email: "refresh@example.com",
      password: "Password123!",
    });

    const initialTokens = await loginWithPassword({
      email,
      password: "Password123!",
    });

    const oldSessionId = decodeSessionId(initialTokens.refreshToken);

    const refreshedTokens = await refreshTokens({
      refreshToken: initialTokens.refreshToken,
    });

    expect(refreshedTokens.refreshToken).not.toBe(initialTokens.refreshToken);

    const oldSession = await Effect.runPromise(auth.authRepo.getSession(oldSessionId));
    expect(Option.isNone(oldSession)).toBe(true);

    const newSessionId = decodeSessionId(refreshedTokens.refreshToken);
    const newSession = await Effect.runPromise(auth.authRepo.getSession(newSessionId));
    expect(Option.isSome(newSession)).toBe(true);
  });

  it("refreshTokens rejects invalid token", async () => {
    const result = await refreshTokensEither({ refreshToken: "bad-token" });

    expectLeftTag(result, "InvalidRefreshToken");
  });

  it("logout removes a session", async () => {
    const { email } = await createUser({
      email: "logout@example.com",
      password: "Password123!",
    });

    const tokens = await loginWithPassword({
      email,
      password: "Password123!",
    });

    const sessionId = decodeSessionId(tokens.refreshToken);

    await logout({ refreshToken: tokens.refreshToken });

    const sessionOpt = await Effect.runPromise(auth.authRepo.getSession(sessionId));
    expect(Option.isNone(sessionOpt)).toBe(true);
  });

  it("logoutAll removes all sessions for user", async () => {
    const { email, id: userId } = await createUser({
      email: "logout-all@example.com",
      password: "Password123!",
    });

    const tokensA = await loginWithPassword({
      email,
      password: "Password123!",
    });

    const tokensB = await loginWithPassword({
      email,
      password: "Password123!",
    });

    const sessionA = decodeSessionId(tokensA.refreshToken);
    const sessionB = decodeSessionId(tokensB.refreshToken);

    await logoutAll({ userId });

    expect(Option.isNone(await Effect.runPromise(auth.authRepo.getSession(sessionA)))).toBe(true);
    expect(Option.isNone(await Effect.runPromise(auth.authRepo.getSession(sessionB)))).toBe(true);
  });

  it("verifyEmailOtp marks user verified", async () => {
    const { id: userId } = await createUser({
      email: "verify@example.com",
      password: "Password123!",
      verify: "UNVERIFIED",
    });

    await Effect.runPromise(
      auth.authRepo.saveEmailOtp({
        userId,
        email: "verify@example.com",
        kind: "verify-email",
        otp: "123456",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    await verifyEmailOtp({ userId, otp: "123456" });

    const updated = await Effect.runPromise(auth.userQueryRepo.findById(userId));
    if (Option.isNone(updated)) {
      throw new Error("Expected user to exist");
    }
    expect(updated.value.verify).toBe("VERIFIED");
  });

  it("verifyEmailOtp rejects invalid otp", async () => {
    const { id: userId } = await createUser({
      email: "verify-invalid@example.com",
      password: "Password123!",
      verify: "UNVERIFIED",
    });

    await Effect.runPromise(
      auth.authRepo.saveEmailOtp({
        userId,
        email: "verify-invalid@example.com",
        kind: "verify-email",
        otp: "123456",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const result = await verifyEmailOtpEither({ userId, otp: "000000" });

    const err = expectInvalidOtp(result);
    expect(err.retriable).toBe(true);
  });

  it("verifyEmailOtp keeps otp after invalid attempt", async () => {
    const { id: userId } = await createUser({
      email: "verify-retry@example.com",
      password: "Password123!",
      verify: "UNVERIFIED",
    });

    await Effect.runPromise(
      auth.authRepo.saveEmailOtp({
        userId,
        email: "verify-retry@example.com",
        kind: "verify-email",
        otp: "123456",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const firstResult = await verifyEmailOtpEither({ userId, otp: "000000" });
    const firstErr = expectInvalidOtp(firstResult);
    expect(firstErr.retriable).toBe(true);

    await verifyEmailOtp({ userId, otp: "123456" });

    const updated = await Effect.runPromise(auth.userQueryRepo.findById(userId));
    if (Option.isNone(updated)) {
      throw new Error("Expected user to exist");
    }
    expect(updated.value.verify).toBe("VERIFIED");
  });

  it("verifyResetPasswordOtp + resetPassword invalidates sessions and updates password", async () => {
    const { id: userId, email } = await createUser({
      email: "reset@example.com",
      password: "Password123!",
    });

    const beforeResetTokens = await loginWithPassword({
      email,
      password: "Password123!",
    });
    const beforeResetSessionId = decodeSessionId(beforeResetTokens.refreshToken);

    await Effect.runPromise(
      auth.authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "654321",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const verified = await verifyResetPasswordOtp({
      email,
      otp: "654321",
    });

    await resetPassword({
      resetToken: verified.resetToken,
      newPassword: "NewPassword123!",
    });

    const oldSession = await Effect.runPromise(auth.authRepo.getSession(beforeResetSessionId));
    expect(Option.isNone(oldSession)).toBe(true);

    const updated = await Effect.runPromise(auth.userQueryRepo.findById(userId));
    if (Option.isNone(updated)) {
      throw new Error("Expected user to exist");
    }
    const matches = await bcrypt.compare("NewPassword123!", updated.value.passwordHash);
    expect(matches).toBe(true);
  });

  it("verifyResetPasswordOtp rejects invalid otp", async () => {
    const { id: userId, email } = await createUser({
      email: "reset-invalid@example.com",
      password: "Password123!",
    });

    await Effect.runPromise(
      auth.authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "111111",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const result = await verifyResetPasswordOtpEither({
      email,
      otp: "000000",
    });

    const err = expectInvalidOtp(result);
    expect(err.retriable).toBe(true);
  });

  it("verifyResetPasswordOtp keeps otp after invalid attempt", async () => {
    const { id: userId, email } = await createUser({
      email: "reset-retry@example.com",
      password: "Password123!",
    });

    await Effect.runPromise(
      auth.authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "111111",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const firstResult = await verifyResetPasswordOtpEither({
      email,
      otp: "000000",
    });
    const firstErr = expectInvalidOtp(firstResult);
    expect(firstErr.retriable).toBe(true);

    const verified = await verifyResetPasswordOtp({
      email,
      otp: "111111",
    });

    await resetPassword({
      resetToken: verified.resetToken,
      newPassword: "NewPassword123!",
    });

    const updated = await Effect.runPromise(auth.userQueryRepo.findById(userId));
    if (Option.isNone(updated)) {
      throw new Error("Expected user to exist");
    }
    const matches = await bcrypt.compare("NewPassword123!", updated.value.passwordHash);
    expect(matches).toBe(true);
  });

  it("verifyResetPasswordOtp invalidates otp after max failed attempts", async () => {
    const { id: userId, email } = await createUser({
      email: "reset-attempt-limit@example.com",
      password: "Password123!",
    });

    await Effect.runPromise(
      auth.authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "111111",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    for (let i = 0; i < OTP_MAX_ATTEMPTS; i += 1) {
      const result = await verifyResetPasswordOtpEither({
        email,
        otp: "000000",
      });

      const err = expectInvalidOtp(result);
      expect(err.retriable).toBe(i < OTP_MAX_ATTEMPTS - 1);
    }

    const finalResult = await verifyResetPasswordOtpEither({
      email,
      otp: "111111",
    });
    const finalErr = expectInvalidOtp(finalResult);
    expect(finalErr.retriable).toBe(false);
  });

  it("resetPassword rejects invalid reset token", async () => {
    const result = await resetPasswordEither({
      resetToken: "invalid-token",
      newPassword: "NewPassword123!",
    });

    expectInvalidResetToken(result);
  });

  it("resetPassword reset token is one-time use", async () => {
    const { id: userId, email } = await createUser({
      email: "reset-one-time@example.com",
      password: "Password123!",
    });

    await Effect.runPromise(
      auth.authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "654321",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const verified = await verifyResetPasswordOtp({
      email,
      otp: "654321",
    });

    await resetPassword({
      resetToken: verified.resetToken,
      newPassword: "NewPassword123!",
    });

    const secondUse = await resetPasswordEither({
      resetToken: verified.resetToken,
      newPassword: "AnotherPassword123!",
    });

    expectInvalidResetToken(secondUse);
  });

  it("resetPassword returns InvalidResetToken when token user does not exist", async () => {
    const resetToken = "token-missing-user";
    await Effect.runPromise(auth.authRepo.saveResetPasswordToken({
      token: resetToken,
      userId: uuidv7(),
      email: "missing-user@example.com",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    }));

    const result = await resetPasswordEither({
      resetToken,
      newPassword: "NewPassword123!",
    });

    expectInvalidResetToken(result);
  });
});
