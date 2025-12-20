import bcrypt from "bcrypt";
import { Context, Effect, Layer, Option } from "effect";
import jwt from "jsonwebtoken";
import { uuidv7 } from "uuidv7";

import type { UserRow } from "@/domain/users";

import { UserRepository } from "@/domain/users/repository/user.repository";
import { Email } from "@/infrastructure/email";

import type {
  AuthFailure,
} from "../domain-errors";
import type {
  Tokens,
} from "../jwt";
import type { EmailOtpRecord, RefreshTokenPayload } from "../models";
import type { AuthRepo } from "../repository/auth.repository";

import { RESET_OTP_TTL_MS, VERIFY_OTP_TTL_MS } from "../config";
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
import { generateOtp, isOtpExpired } from "../otp";
import { AuthRepository } from "../repository/auth.repository";

export type AuthService = {
  loginWithPassword: (args: {
    email: string;
    password: string;
  }) => Effect.Effect<Tokens, AuthFailure>;
  refreshTokens: (args: { refreshToken: string }) => Effect.Effect<Tokens, AuthFailure>;
  logout: (args: { sessionId: string }) => Effect.Effect<void>;
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

export class AuthServiceTag extends Context.Tag("AuthService")<
  AuthServiceTag,
  AuthService
>() {}

export function hashPassword(password: string): Effect.Effect<string> {
  return Effect.promise(() => bcrypt.hash(password, 10));
}

export function createSessionForUser(
  authRepo: AuthRepo,
  user: UserRow,
): Effect.Effect<Tokens, never> {
  return Effect.gen(function* () {
    const sessionId = uuidv7();
    const tokens = makeTokensForUser(user, sessionId);
    const session = makeSessionFromRefreshToken(user.id, tokens.refreshToken, sessionId);

    yield* authRepo.saveSession(session).pipe(
      Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
    );

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
      jwt.verify(token, requireJwtSecret()) as RefreshTokenPayload & jwt.JwtPayload,
    catch: () => new InvalidRefreshToken({}),
  }).pipe(
    Effect.flatMap(payload =>
      payload.tokenType === "refresh"
        ? Effect.succeed(payload)
        : Effect.fail(new InvalidRefreshToken({})),
    ),
  );
}

export const AuthServiceLive = Layer.effect(
  AuthServiceTag,
  Effect.gen(function* () {
    const authRepo = yield* AuthRepository;
    const userRepo = yield* UserRepository;
    const email = yield* Email;

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
        };

        yield* authRepo.saveEmailOtp(record).pipe(
          Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
        );

        const html = `<p>Hi ${fullName},</p><p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
        // TODO: use templated email content and map EmailSendError to domain errors if needed
        yield* email.send({
          to: addr,
          subject: "Verify your email",
          html,
        }).pipe(Effect.catchAll(err => Effect.die(err)));
      });

    const loginWithPassword: AuthService["loginWithPassword"] = ({ email: addr, password }) =>
      Effect.gen(function* () {
        const userOpt = yield* userRepo.findByEmail(addr).pipe(
          Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
        );
        if (Option.isNone(userOpt)) {
          yield* Effect.promise(() =>
            bcrypt.compare(password, "$2b$10$C/.BkQrbVHwLsNweXs55we5OK4N9AYaqCrxrDG3lqF7DRgt21FiSG"),
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
        yield* authRepo.deleteSession(sessionId).pipe(
          Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
        );

        return tokens;
      });

    const logout: AuthService["logout"] = ({ sessionId }) =>
      authRepo.deleteSession(sessionId).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );

    const logoutAll: AuthService["logoutAll"] = ({ userId }) =>
      authRepo.deleteAllSessionsForUser(userId).pipe(
        Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
      );

    const verifyEmailOtp: AuthService["verifyEmailOtp"] = ({ userId, otp }) =>
      Effect.gen(function* () {
        const recordOpt = yield* authRepo.consumeEmailOtp({
          userId,
          kind: "verify-email",
        }).pipe(Effect.catchTag("AuthRepositoryError", err => Effect.die(err)));

        if (Option.isNone(recordOpt)) {
          return yield* Effect.fail(new InvalidOtp({}));
        }
        const record = recordOpt.value;

        if (record.otp !== otp || isOtpExpired(record.expiresAt)) {
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
        };

        yield* authRepo.saveEmailOtp(record).pipe(
          Effect.catchTag("AuthRepositoryError", err => Effect.die(err)),
        );

        const html = `<p>Hi ${user.fullname},</p><p>Your password reset code is <strong>${otp}</strong>. It expires in 5 minutes.</p>`;
        // TODO: use templated email content and map EmailSendError to domain errors if needed
        yield* email.send({
          to: addr,
          subject: "Reset your password",
          html,
        }).pipe(Effect.catchAll(err => Effect.die(err)));
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

        const recordOpt = yield* authRepo.consumeEmailOtp({
          userId: user.id,
          kind: "reset-password",
        }).pipe(Effect.catchTag("AuthRepositoryError", err => Effect.die(err)));

        if (Option.isNone(recordOpt)) {
          return yield* Effect.fail(new InvalidOtp({}));
        }

        const record = recordOpt.value;
        if (record.email !== addr || record.otp !== otp || isOtpExpired(record.expiresAt)) {
          return yield* Effect.fail(new InvalidOtp({}));
        }

        const hash = yield* Effect.promise(() => bcrypt.hash(newPassword, 10));
        const updated = yield* userRepo.updatePassword(user.id, hash).pipe(
          Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
        );
        if (Option.isNone(updated)) {
          return yield* Effect.fail(new InvalidOtp({}));
        }
      });

    const service: AuthService = {
      loginWithPassword,
      refreshTokens,
      logout,
      logoutAll,
      sendVerifyEmail,
      verifyEmailOtp,
      sendResetPassword,
      resetPassword,
    };

    return service;
  }),
);
