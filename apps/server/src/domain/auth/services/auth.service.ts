import bcrypt from "bcrypt";
import { Effect, Layer, Option } from "effect";
import jwt from "jsonwebtoken";
import { uuidv7 } from "uuidv7";

import type { UserRow } from "@/domain/users";
import type { UserRepo } from "@/domain/users/repository/user.repository";
import type { PrismaClient } from "generated/prisma/client";

import { env } from "@/config/env";
import { UserRepository } from "@/domain/users/repository/user.repository";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

import type {
  AuthFailure,
} from "../domain-errors";
import type {
  Tokens,
} from "../jwt";
import type { EmailOtpRecord, RefreshTokenPayload } from "../models";
import type { AuthEventRepo } from "../repository/auth-event.repository";
import type { AuthRepo } from "../repository/auth.repository";

import { OTP_MAX_ATTEMPTS, RESET_OTP_TTL_MS, VERIFY_OTP_TTL_MS } from "../config";
import {
  InvalidCredentials,
  InvalidOtp,
  InvalidRefreshToken,
} from "../domain-errors";
import {
  makeSessionFromRefreshToken,
  makeTokensForUser,
  requireJwtSecret,
} from "../jwt";
import { generateOtp } from "../otp";
import { AuthEventRepository } from "../repository/auth-event.repository";
import { AuthRepository } from "../repository/auth.repository";

const INVALID_PASSWORD_DUMMY_HASH = bcrypt.hashSync(
  "mebike.invalid.password",
  env.BCRYPT_SALT_ROUNDS,
);

export type AuthService = {
  loginWithPassword: (args: {
    email: string;
    password: string;
  }) => Effect.Effect<Tokens, AuthFailure>;
  refreshTokens: (args: { refreshToken: string }) => Effect.Effect<Tokens, AuthFailure>;
  logout: (args: { refreshToken: string }) => Effect.Effect<void, AuthFailure>;
  logoutAll: (args: { userId: string }) => Effect.Effect<void>;
  sendVerifyEmail: (args: {
    userId: string;
    email: string;
    fullName: string;
  }) => Effect.Effect<void>;
  verifyEmailOtp: (args: { userId: string; otp: string }) => Effect.Effect<void, InvalidOtp>;
  sendResetPassword: (args: { email: string }) => Effect.Effect<void>;
  resetPassword: (args: {
    email: string;
    otp: string;
    newPassword: string;
  }) => Effect.Effect<void, InvalidOtp>;
};

function recordSessionIssued(
  authEventRepo: AuthEventRepo,
  userId: string,
): Effect.Effect<void, never> {
  return authEventRepo.recordSessionIssued({
    userId,
    occurredAt: new Date(),
  }).pipe(
    Effect.tapError(err =>
      Effect.sync(() => {
        logger.warn({ err, userId }, "Failed to write AuthEvent for active-user stats");
      }),
    ),
    Effect.catchAll(() => Effect.succeed(undefined)),
  );
}

export function hashPassword(password: string): Effect.Effect<string> {
  return Effect.promise(() => bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS));
}

export function createSessionForUser(
  authRepo: AuthRepo,
  authEventRepo: AuthEventRepo,
  user: UserRow,
): Effect.Effect<Tokens, never> {
  return Effect.gen(function* () {
    const sessionId = uuidv7();
    const tokens = makeTokensForUser(user, sessionId);
    const session = makeSessionFromRefreshToken(user.id, tokens.refreshToken, sessionId);

    yield* authRepo.saveSession(session).pipe(
      Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
    );

    yield* recordSessionIssued(authEventRepo, user.id);

    return tokens;
  });
}

function verifyRefreshToken(token: string): Effect.Effect<
  RefreshTokenPayload & jwt.JwtPayload,
  InvalidRefreshToken,
  never
> {
  return Effect.try({
    try: () =>
      jwt.verify(token, requireJwtSecret(), { algorithms: ["HS256"] }) as RefreshTokenPayload & jwt.JwtPayload,
    catch: () => new InvalidRefreshToken({}),
  }).pipe(
    Effect.flatMap(payload =>
      payload.tokenType === "refresh"
        ? Effect.succeed(payload)
        : Effect.fail(new InvalidRefreshToken({})),
    ),
  );
}

type AuthServiceDeps = {
  authRepo: AuthRepo;
  authEventRepo: AuthEventRepo;
  userRepo: UserRepo;
  client: PrismaClient;
};

export function makeAuthService({
  authRepo,
  authEventRepo,
  userRepo,
  client,
}: AuthServiceDeps): AuthService {
  const sendVerifyEmail: AuthService["sendVerifyEmail"] = ({ userId, email: addr, fullName }) =>
    Effect.gen(function* () {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + VERIFY_OTP_TTL_MS);
      const record: EmailOtpRecord = {
        userId,
        email: addr,
        kind: "verify-email",
        otp,
        expiresAt,
        attemptsRemaining: OTP_MAX_ATTEMPTS,
      };

      yield* authRepo.saveEmailOtp(record).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );

      const expiresInMinutes = Math.max(1, Math.ceil(VERIFY_OTP_TTL_MS / 60000));
      // TODO: use templated email content and map enqueue failures to domain errors if needed
      yield* enqueueOutboxJobInTx(client, {
        type: JobTypes.EmailSend,
        payload: {
          version: 1,
          to: addr,
          kind: "auth.verifyOtp",
          fullName,
          otp,
          expiresInMinutes,
        },
        runAt: new Date(),
      });
    });

  const loginWithPassword: AuthService["loginWithPassword"] = ({ email: addr, password }) =>
    Effect.gen(function* () {
      const userOpt = yield* userRepo.findByEmail(addr).pipe(
        Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
      );
      if (Option.isNone(userOpt)) {
        yield* Effect.promise(() =>
          bcrypt.compare(password, INVALID_PASSWORD_DUMMY_HASH),
        ).pipe(Effect.ignore);
        return yield* Effect.fail(new InvalidCredentials({}));
      }
      const user = userOpt.value;

      const ok = yield* Effect.promise(() => bcrypt.compare(password, user.passwordHash));

      if (!ok) {
        return yield* Effect.fail(new InvalidCredentials({}));
      }

      const sessionId = uuidv7();
      const tokens = makeTokensForUser(user, sessionId);
      const session = makeSessionFromRefreshToken(user.id, tokens.refreshToken, sessionId);

      yield* authRepo.saveSession(session).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );

      yield* recordSessionIssued(authEventRepo, user.id);

      return tokens;
    });

  const refreshTokens: AuthService["refreshTokens"] = ({ refreshToken }) =>
    Effect.gen(function* () {
      const payload = yield* verifyRefreshToken(refreshToken);
      const sessionId = payload.jti ?? refreshToken;

      const sessionOpt = yield* authRepo.getSession(sessionId).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );
      if (Option.isNone(sessionOpt)) {
        return yield* Effect.fail(new InvalidRefreshToken({}));
      }
      const session = sessionOpt.value;

      if (session.refreshToken !== refreshToken || session.expiresAt.getTime() <= Date.now()) {
        return yield* Effect.fail(new InvalidRefreshToken({}));
      }

      const userOpt = yield* userRepo.findById(session.userId).pipe(
        Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
      );
      if (Option.isNone(userOpt)) {
        return yield* Effect.fail(new InvalidRefreshToken({}));
      }
      const user = userOpt.value;

      const newSessionId = uuidv7();
      const tokens = makeTokensForUser(user, newSessionId);
      const newSession = makeSessionFromRefreshToken(
        session.userId,
        tokens.refreshToken,
        newSessionId,
      );

      yield* authRepo.saveSession(newSession).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );
      yield* recordSessionIssued(authEventRepo, user.id);
      yield* authRepo.deleteSession(sessionId).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );

      return tokens;
    });

  const logout: AuthService["logout"] = ({ refreshToken }) =>
    Effect.gen(function* () {
      const payload = yield* verifyRefreshToken(refreshToken);
      const sessionId = payload.jti ?? refreshToken;

      const sessionOpt = yield* authRepo.getSession(sessionId).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );
      if (Option.isNone(sessionOpt)) {
        return yield* Effect.fail(new InvalidRefreshToken({}));
      }
      const session = sessionOpt.value;

      if (session.refreshToken !== refreshToken || session.expiresAt.getTime() <= Date.now()) {
        return yield* Effect.fail(new InvalidRefreshToken({}));
      }

      yield* authRepo.deleteSession(sessionId).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );
    });

  const logoutAll: AuthService["logoutAll"] = ({ userId }) =>
    authRepo.deleteAllSessionsForUser(userId).pipe(
      Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
    );

  const verifyEmailOtp: AuthService["verifyEmailOtp"] = ({ userId, otp }) =>
    Effect.gen(function* () {
      const verification = yield* authRepo.verifyEmailOtpAttempt({
        userId,
        kind: "verify-email",
        otp,
      }).pipe(Effect.catchTag("AuthRepositoryError", err => Effect.die(err)));

      if (verification !== "valid") {
        return yield* Effect.fail(new InvalidOtp({}));
      }

      const updated = yield* userRepo.markVerified(userId).pipe(
        Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
      );
      if (Option.isNone(updated)) {
        return yield* Effect.fail(new InvalidOtp({}));
      }
    });

  const sendResetPassword: AuthService["sendResetPassword"] = ({ email: addr }) =>
    Effect.gen(function* () {
      const userOpt = yield* userRepo.findByEmail(addr).pipe(
        Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
      );
      if (Option.isNone(userOpt)) {
        return;
      }
      const user = userOpt.value;

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + RESET_OTP_TTL_MS);
      const record: EmailOtpRecord = {
        userId: user.id,
        email: addr,
        kind: "reset-password",
        otp,
        expiresAt,
        attemptsRemaining: OTP_MAX_ATTEMPTS,
      };

      yield* authRepo.saveEmailOtp(record).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );

      const expiresInMinutes = Math.max(1, Math.ceil(RESET_OTP_TTL_MS / 60000));
      // TODO: use templated email content and map enqueue failures to domain errors if needed I wonder if this thing
      // could fail we are writing to outbox after all
      yield* enqueueOutboxJobInTx(client, {
        type: JobTypes.EmailSend,
        payload: {
          version: 1,
          to: addr,
          kind: "auth.resetOtp",
          fullName: user.fullname,
          otp,
          expiresInMinutes,
        },
        runAt: new Date(),
      });
    });

  const resetPassword: AuthService["resetPassword"] = ({ email: addr, otp, newPassword }) =>
    Effect.gen(function* () {
      const userOpt = yield* userRepo.findByEmail(addr).pipe(
        Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
      );
      if (Option.isNone(userOpt)) {
        return yield* Effect.fail(new InvalidOtp({}));
      }
      const user = userOpt.value;

      const verification = yield* authRepo.verifyEmailOtpAttempt({
        userId: user.id,
        kind: "reset-password",
        otp,
        email: addr,
      }).pipe(Effect.catchTag("AuthRepositoryError", err => Effect.die(err)));

      if (verification !== "valid") {
        return yield* Effect.fail(new InvalidOtp({}));
      }

      const hash = yield* Effect.promise(() => bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS));
      const updated = yield* userRepo.updatePassword(user.id, hash).pipe(
        Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
      );
      if (Option.isNone(updated)) {
        return yield* Effect.fail(new InvalidOtp({}));
      }
    });

  return {
    loginWithPassword,
    refreshTokens,
    logout,
    logoutAll,
    sendVerifyEmail,
    verifyEmailOtp,
    sendResetPassword,
    resetPassword,
  };
}

const makeAuthServiceEffect = Effect.gen(function* () {
  const authRepo = yield* AuthRepository;
  const authEventRepo = yield* AuthEventRepository;
  const userRepo = yield* UserRepository;
  const { client } = yield* Prisma;
  return makeAuthService({
    authRepo,
    authEventRepo,
    userRepo,
    client,
  });
});

export class AuthServiceTag extends Effect.Service<AuthServiceTag>()(
  "AuthService",
  {
    effect: makeAuthServiceEffect,
  },
) {}

export const AuthServiceLive = Layer.effect(
  AuthServiceTag,
  makeAuthServiceEffect.pipe(Effect.map(AuthServiceTag.make)),
);
