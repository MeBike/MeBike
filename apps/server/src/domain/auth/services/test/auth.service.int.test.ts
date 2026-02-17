import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { Effect, Either, Layer, Option } from "effect";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { env } from "@/config/env";
import { makeUserRepository } from "@/domain/users/repository/user.repository";
import { startRedis } from "@/test/db/redis";
import { getTestDatabase } from "@/test/db/test-database";
import { PrismaClient } from "generated/prisma/client";

import { OTP_MAX_ATTEMPTS } from "../../config";
import { makeAuthEventRepository } from "../../repository/auth-event.repository";
import { authRepositoryFactory } from "../../repository/auth.repository";
import { AuthServiceTag, makeAuthService } from "../auth.service";

function expectLeftTag<E extends { _tag: string }>(result: Either.Either<unknown, E>, tag: E["_tag"]) {
  if (Either.isRight(result)) {
    throw new Error(`Expected Left ${tag}, got Right`);
  }
  expect(result.left._tag).toBe(tag);
}

function expectInvalidOtp(result: Either.Either<unknown, { _tag: string; retriable?: boolean }>) {
  if (Either.isRight(result)) {
    throw new Error("Expected Left InvalidOtp, got Right");
  }
  expect(result.left._tag).toBe("InvalidOtp");
  return result.left as { _tag: "InvalidOtp"; retriable: boolean };
}

function expectInvalidResetToken(result: Either.Either<unknown, { _tag: string }>) {
  if (Either.isRight(result)) {
    throw new Error("Expected Left InvalidResetToken, got Right");
  }
  expect(result.left._tag).toBe("InvalidResetToken");
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
  let pgContainer: { stop: () => Promise<void>; url: string };
  let redisContainer: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let redisClient: Redis;
  let depsLayer: Layer.Layer<AuthServiceTag>;

  let authRepo: ReturnType<typeof authRepositoryFactory>;
  let userRepo: ReturnType<typeof makeUserRepository>;

  beforeAll(async () => {
    pgContainer = await getTestDatabase();

    const adapter = new PrismaPg({ connectionString: pgContainer.url });
    client = new PrismaClient({ adapter });

    redisContainer = await startRedis();
    redisClient = new Redis(redisContainer.url);

    authRepo = authRepositoryFactory(redisClient);
    userRepo = makeUserRepository(client);

    const authService = makeAuthService({
      authRepo,
      authEventRepo: makeAuthEventRepository(client),
      userRepo,
      client,
    });

    depsLayer = Layer.succeed(AuthServiceTag, AuthServiceTag.make(authService));
  }, 60000);

  afterEach(async () => {
    await client.authEvent.deleteMany({});
    await client.user.deleteMany({});
    await redisClient.flushdb();
  });

  afterAll(async () => {
    if (redisClient)
      await redisClient.quit();
    if (redisContainer)
      await redisContainer.stop();
    if (client)
      await client.$disconnect();
    if (pgContainer)
      await pgContainer.stop();
  });

  const runWithService = <A, E>(
    eff: Effect.Effect<A, E, AuthServiceTag>,
  ) =>
    Effect.runPromise(eff.pipe(Effect.provide(depsLayer)));

  const createUser = async (args: { email: string; password: string; verify?: "UNVERIFIED" | "VERIFIED" }) => {
    const id = uuidv7();
    const passwordHash = await bcrypt.hash(args.password, env.BCRYPT_SALT_ROUNDS);

    await client.user.create({
      data: {
        id,
        fullname: "Auth User",
        email: args.email,
        passwordHash,
        role: "USER",
        verify: args.verify ?? "UNVERIFIED",
      },
    });

    return { id, email: args.email, passwordHash };
  };

  it("loginWithPassword creates tokens and session", async () => {
    const { email } = await createUser({
      email: "login@example.com",
      password: "Password123!",
    });

    const tokens = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.loginWithPassword({
          email,
          password: "Password123!",
        });
      }),
    );

    const sessionId = decodeSessionId(tokens.refreshToken);
    const sessionOpt = await Effect.runPromise(authRepo.getSession(sessionId));

    expect(Option.isSome(sessionOpt)).toBe(true);
  });

  it("loginWithPassword rejects invalid credentials", async () => {
    const { email } = await createUser({
      email: "invalid@example.com",
      password: "Password123!",
    });

    const result = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service
          .loginWithPassword({ email, password: "wrong" })
          .pipe(Effect.either);
      }),
    );

    expectLeftTag(result, "InvalidCredentials");
  });

  it("refreshTokens issues new tokens and invalidates old session", async () => {
    const { email } = await createUser({
      email: "refresh@example.com",
      password: "Password123!",
    });

    const initialTokens = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.loginWithPassword({
          email,
          password: "Password123!",
        });
      }),
    );

    const oldSessionId = decodeSessionId(initialTokens.refreshToken);

    const refreshedTokens = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.refreshTokens({
          refreshToken: initialTokens.refreshToken,
        });
      }),
    );

    expect(refreshedTokens.refreshToken).not.toBe(initialTokens.refreshToken);

    const oldSession = await Effect.runPromise(authRepo.getSession(oldSessionId));
    expect(Option.isNone(oldSession)).toBe(true);

    const newSessionId = decodeSessionId(refreshedTokens.refreshToken);
    const newSession = await Effect.runPromise(authRepo.getSession(newSessionId));
    expect(Option.isSome(newSession)).toBe(true);
  });

  it("refreshTokens rejects invalid token", async () => {
    const result = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.refreshTokens({ refreshToken: "bad-token" }).pipe(Effect.either);
      }),
    );

    expectLeftTag(result, "InvalidRefreshToken");
  });

  it("logout removes a session", async () => {
    const { email } = await createUser({
      email: "logout@example.com",
      password: "Password123!",
    });

    const tokens = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.loginWithPassword({
          email,
          password: "Password123!",
        });
      }),
    );

    const sessionId = decodeSessionId(tokens.refreshToken);

    await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.logout({ refreshToken: tokens.refreshToken });
      }),
    );

    const sessionOpt = await Effect.runPromise(authRepo.getSession(sessionId));
    expect(Option.isNone(sessionOpt)).toBe(true);
  });

  it("logoutAll removes all sessions for user", async () => {
    const { email, id: userId } = await createUser({
      email: "logout-all@example.com",
      password: "Password123!",
    });

    const tokensA = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.loginWithPassword({
          email,
          password: "Password123!",
        });
      }),
    );

    const tokensB = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.loginWithPassword({
          email,
          password: "Password123!",
        });
      }),
    );

    const sessionA = decodeSessionId(tokensA.refreshToken);
    const sessionB = decodeSessionId(tokensB.refreshToken);

    await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.logoutAll({ userId });
      }),
    );

    expect(Option.isNone(await Effect.runPromise(authRepo.getSession(sessionA)))).toBe(true);
    expect(Option.isNone(await Effect.runPromise(authRepo.getSession(sessionB)))).toBe(true);
  });

  it("verifyEmailOtp marks user verified", async () => {
    const { id: userId } = await createUser({
      email: "verify@example.com",
      password: "Password123!",
      verify: "UNVERIFIED",
    });

    await Effect.runPromise(
      authRepo.saveEmailOtp({
        userId,
        email: "verify@example.com",
        kind: "verify-email",
        otp: "123456",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyEmailOtp({ userId, otp: "123456" });
      }),
    );

    const updated = await Effect.runPromise(userRepo.findById(userId));
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
      authRepo.saveEmailOtp({
        userId,
        email: "verify-invalid@example.com",
        kind: "verify-email",
        otp: "123456",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const result = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyEmailOtp({ userId, otp: "000000" }).pipe(Effect.either);
      }),
    );

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
      authRepo.saveEmailOtp({
        userId,
        email: "verify-retry@example.com",
        kind: "verify-email",
        otp: "123456",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const firstResult = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyEmailOtp({ userId, otp: "000000" }).pipe(Effect.either);
      }),
    );
    const firstErr = expectInvalidOtp(firstResult);
    expect(firstErr.retriable).toBe(true);

    await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyEmailOtp({ userId, otp: "123456" });
      }),
    );

    const updated = await Effect.runPromise(userRepo.findById(userId));
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

    const beforeResetTokens = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.loginWithPassword({
          email,
          password: "Password123!",
        });
      }),
    );
    const beforeResetSessionId = decodeSessionId(beforeResetTokens.refreshToken);

    await Effect.runPromise(
      authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "654321",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const verified = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyResetPasswordOtp({
          email,
          otp: "654321",
        });
      }),
    );

    await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.resetPassword({
          resetToken: verified.resetToken,
          newPassword: "NewPassword123!",
        });
      }),
    );

    const oldSession = await Effect.runPromise(authRepo.getSession(beforeResetSessionId));
    expect(Option.isNone(oldSession)).toBe(true);

    const updated = await Effect.runPromise(userRepo.findById(userId));
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
      authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "111111",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const result = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyResetPasswordOtp({
          email,
          otp: "000000",
        }).pipe(Effect.either);
      }),
    );

    const err = expectInvalidOtp(result);
    expect(err.retriable).toBe(true);
  });

  it("verifyResetPasswordOtp keeps otp after invalid attempt", async () => {
    const { id: userId, email } = await createUser({
      email: "reset-retry@example.com",
      password: "Password123!",
    });

    await Effect.runPromise(
      authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "111111",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const firstResult = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyResetPasswordOtp({
          email,
          otp: "000000",
        }).pipe(Effect.either);
      }),
    );
    const firstErr = expectInvalidOtp(firstResult);
    expect(firstErr.retriable).toBe(true);

    const verified = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyResetPasswordOtp({
          email,
          otp: "111111",
        });
      }),
    );

    await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.resetPassword({
          resetToken: verified.resetToken,
          newPassword: "NewPassword123!",
        });
      }),
    );

    const updated = await Effect.runPromise(userRepo.findById(userId));
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
      authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "111111",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    for (let i = 0; i < OTP_MAX_ATTEMPTS; i += 1) {
      const result = await runWithService(
        Effect.gen(function* () {
          const service = yield* AuthServiceTag;
          return yield* service.verifyResetPasswordOtp({
            email,
            otp: "000000",
          }).pipe(Effect.either);
        }),
      );

      const err = expectInvalidOtp(result);
      expect(err.retriable).toBe(i < OTP_MAX_ATTEMPTS - 1);
    }

    const finalResult = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyResetPasswordOtp({
          email,
          otp: "111111",
        }).pipe(Effect.either);
      }),
    );
    const finalErr = expectInvalidOtp(finalResult);
    expect(finalErr.retriable).toBe(false);
  });

  it("resetPassword rejects invalid reset token", async () => {
    const result = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.resetPassword({
          resetToken: "invalid-token",
          newPassword: "NewPassword123!",
        }).pipe(Effect.either);
      }),
    );

    expectInvalidResetToken(result);
  });

  it("resetPassword reset token is one-time use", async () => {
    const { id: userId, email } = await createUser({
      email: "reset-one-time@example.com",
      password: "Password123!",
    });

    await Effect.runPromise(
      authRepo.saveEmailOtp({
        userId,
        email,
        kind: "reset-password",
        otp: "654321",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }),
    );

    const verified = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.verifyResetPasswordOtp({
          email,
          otp: "654321",
        });
      }),
    );

    await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.resetPassword({
          resetToken: verified.resetToken,
          newPassword: "NewPassword123!",
        });
      }),
    );

    const secondUse = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.resetPassword({
          resetToken: verified.resetToken,
          newPassword: "AnotherPassword123!",
        }).pipe(Effect.either);
      }),
    );

    expectInvalidResetToken(secondUse);
  });

  it("resetPassword returns InvalidResetToken when token user does not exist", async () => {
    const resetToken = "token-missing-user";
    await Effect.runPromise(authRepo.saveResetPasswordToken({
      token: resetToken,
      userId: uuidv7(),
      email: "missing-user@example.com",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    }));

    const result = await runWithService(
      Effect.gen(function* () {
        const service = yield* AuthServiceTag;
        return yield* service.resetPassword({
          resetToken,
          newPassword: "NewPassword123!",
        }).pipe(Effect.either);
      }),
    );

    expectInvalidResetToken(result);
  });
});
