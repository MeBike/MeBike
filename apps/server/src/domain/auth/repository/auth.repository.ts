import { Effect, Layer, Option } from "effect";

import { Redis } from "@/infrastructure/redis";

import type {
  EmailOtpKind,
  EmailOtpRecord,
  RefreshSession,
  ResetPasswordTokenRecord,
} from "../models";

import { OTP_MAX_ATTEMPTS } from "../config";
import { AuthRepositoryError } from "../domain-errors";

export type AuthRepo = {
  readonly saveSession: (
    session: RefreshSession,
  ) => Effect.Effect<void, AuthRepositoryError>;
  readonly getSession: (
    sessionId: string,
  ) => Effect.Effect<Option.Option<RefreshSession>, AuthRepositoryError>;
  readonly deleteSession: (
    sessionId: string,
  ) => Effect.Effect<void, AuthRepositoryError>;
  readonly deleteAllSessionsForUser: (
    userId: string,
  ) => Effect.Effect<void, AuthRepositoryError>;

  readonly saveEmailOtp: (
    record: EmailOtpRecord,
  ) => Effect.Effect<void, AuthRepositoryError>;
  readonly getEmailOtp: (params: {
    userId: string;
    kind: EmailOtpKind;
  }) => Effect.Effect<Option.Option<EmailOtpRecord>, AuthRepositoryError>;
  readonly consumeEmailOtp: (params: {
    userId: string;
    kind: EmailOtpKind;
  }) => Effect.Effect<Option.Option<EmailOtpRecord>, AuthRepositoryError>;
  readonly verifyEmailOtpAttempt: (params: {
    userId: string;
    kind: EmailOtpKind;
    otp: string;
    email?: string;
  }) => Effect.Effect<"valid" | "invalidRetryable" | "invalidTerminal", AuthRepositoryError>;
  readonly saveResetPasswordToken: (
    record: ResetPasswordTokenRecord,
  ) => Effect.Effect<void, AuthRepositoryError>;
  readonly consumeResetPasswordToken: (
    token: string,
  ) => Effect.Effect<Option.Option<ResetPasswordTokenRecord>, AuthRepositoryError>;
};

const makeAuthRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Redis;
  return makeAuthRepository(client);
});

export class AuthRepository extends Effect.Service<AuthRepository>()(
  "AuthRepository",
  {
    effect: makeAuthRepositoryEffect,
  },
) {}

function parseSession(json: string): RefreshSession {
  const raw = JSON.parse(json) as RefreshSession & {
    issuedAt: string;
    expiresAt: string;
  };
  return {
    ...raw,
    issuedAt: new Date(raw.issuedAt),
    expiresAt: new Date(raw.expiresAt),
  };
}

function parseEmailOtpRecord(json: string): EmailOtpRecord {
  const raw = JSON.parse(json) as EmailOtpRecord & { expiresAt: string };
  return {
    ...raw,
    expiresAt: new Date(raw.expiresAt),
  };
}

function parseResetPasswordTokenRecord(json: string): ResetPasswordTokenRecord {
  const raw = JSON.parse(json) as ResetPasswordTokenRecord & { expiresAt: string };
  return {
    ...raw,
    expiresAt: new Date(raw.expiresAt),
  };
}

function ttlFromDate(date: Date): number {
  const ttlMs = date.getTime() - Date.now();
  return Math.max(1, Math.floor(ttlMs / 1000));
}

function withDefaultAttempts(record: EmailOtpRecord): EmailOtpRecord & { attemptsRemaining: number } {
  return {
    ...record,
    attemptsRemaining: record.attemptsRemaining ?? OTP_MAX_ATTEMPTS,
  };
}
// TODO : IF somewhere or someone start using it EXPOT THIS oUT
const sessionKey = (sid: string) => `auth:session:${sid}`;
const userSessionsKey = (uid: string) => `auth:user-sessions:${uid}`;
const otpKey = (kind: EmailOtpKind, uid: string) => `auth:otp:${kind}:${uid}`;
const resetPasswordTokenKey = (token: string) => `auth:reset-token:${token}`;
const OTP_ATTEMPT_TX_MAX_RETRIES = 5;

function makeAuthRepository(client: import("ioredis").default): AuthRepo {
  return {
    saveSession: session =>
      Effect.tryPromise({
        try: async () => {
          const sessionRedisKey = sessionKey(session.sessionId);
          const userSessionsRedisKey = userSessionsKey(session.userId);
          const ttl = ttlFromDate(session.expiresAt);
          const sessionJson = JSON.stringify(session);

          await client.setex(sessionRedisKey, ttl, sessionJson);
          await client.sadd(userSessionsRedisKey, session.sessionId);
          await client.expire(userSessionsRedisKey, ttl);
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "saveSession",
            cause,
          }),
      }),

    getSession: sessionId =>
      Effect.tryPromise({
        try: async () => {
          const redisKey = sessionKey(sessionId);
          const json = await client.get(redisKey);
          return json == null ? Option.none() : Option.some(parseSession(json));
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "getSession",
            cause,
          }),
      }),

    deleteSession: sessionId =>
      Effect.tryPromise({
        try: async () => {
          const redisKey = sessionKey(sessionId);
          await client.del(redisKey);
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "deleteSession",
            cause,
          }),
      }),

    deleteAllSessionsForUser: userId =>
      Effect.tryPromise({
        try: async () => {
          const userSessionsRedisKey = userSessionsKey(userId);
          const sessionIds = await client.smembers(userSessionsRedisKey);

          if (sessionIds.length === 0) {
            return;
          }

          // Create a pipeline to delete all sessions and the user sessions set
          const pipeline = client.pipeline();

          for (const sessionId of sessionIds) {
            pipeline.del(sessionKey(sessionId));
          }

          pipeline.del(userSessionsRedisKey);

          await pipeline.exec();
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "deleteAllSessionsForUser",
            cause,
          }),
      }),

    saveEmailOtp: record =>
      Effect.tryPromise({
        try: async () => {
          const normalized = withDefaultAttempts(record);
          const redisKey = otpKey(normalized.kind, normalized.userId);
          const ttl = ttlFromDate(normalized.expiresAt);
          const recordJson = JSON.stringify(normalized);

          await client.setex(redisKey, ttl, recordJson);
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "saveEmailOtp",
            cause,
          }),
      }),

    getEmailOtp: ({ userId, kind }) =>
      Effect.tryPromise({
        try: async () => {
          const redisKey = otpKey(kind, userId);
          const json = await client.get(redisKey);
          return json == null ? Option.none() : Option.some(parseEmailOtpRecord(json));
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "getEmailOtp",
            cause,
          }),
      }),

    consumeEmailOtp: ({ userId, kind }) =>
      Effect.tryPromise({
        try: async () => {
          const redisKey = otpKey(kind, userId);

          const json = await client.get(redisKey);

          if (json == null) {
            return Option.none();
          }

          const record = parseEmailOtpRecord(json);

          await client.del(redisKey);

          return Option.some(record);
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "consumeEmailOtp",
            cause,
          }),
      }),

    verifyEmailOtpAttempt: ({ userId, kind, otp, email }) =>
      Effect.tryPromise({
        try: async () => {
          const redisKey = otpKey(kind, userId);

          for (let attempts = 0; attempts < OTP_ATTEMPT_TX_MAX_RETRIES; attempts += 1) {
            await client.watch(redisKey);
            const json = await client.get(redisKey);

            if (json == null) {
              await client.unwatch();
              return "invalidTerminal";
            }

            const record = withDefaultAttempts(parseEmailOtpRecord(json));
            if (email != null && record.email !== email) {
              const nextAttempts = record.attemptsRemaining - 1;
              const tx = client.multi();
              if (nextAttempts <= 0) {
                tx.del(redisKey);
              }
              else {
                tx.setex(
                  redisKey,
                  ttlFromDate(record.expiresAt),
                  JSON.stringify({ ...record, attemptsRemaining: nextAttempts }),
                );
              }
              const result = await tx.exec();
              if (result == null) {
                continue;
              }
              return nextAttempts > 0 ? "invalidRetryable" : "invalidTerminal";
            }

            if (record.otp === otp) {
              const tx = client.multi();
              tx.del(redisKey);
              const result = await tx.exec();
              if (result == null) {
                continue;
              }
              return "valid";
            }

            const nextAttempts = record.attemptsRemaining - 1;
            const tx = client.multi();
            if (nextAttempts <= 0) {
              tx.del(redisKey);
            }
            else {
              tx.setex(
                redisKey,
                ttlFromDate(record.expiresAt),
                JSON.stringify({ ...record, attemptsRemaining: nextAttempts }),
              );
            }
            const result = await tx.exec();
            if (result == null) {
              continue;
            }
            return nextAttempts > 0 ? "invalidRetryable" : "invalidTerminal";
          }

          await client.unwatch();
          return "invalidTerminal";
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "verifyEmailOtpAttempt",
            cause,
          }),
      }),

    saveResetPasswordToken: record =>
      Effect.tryPromise({
        try: async () => {
          const redisKey = resetPasswordTokenKey(record.token);
          const ttl = ttlFromDate(record.expiresAt);
          await client.setex(redisKey, ttl, JSON.stringify(record));
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "saveResetPasswordToken",
            cause,
          }),
      }),

    consumeResetPasswordToken: token =>
      Effect.tryPromise({
        try: async () => {
          const redisKey = resetPasswordTokenKey(token);
          const json = await client.getdel(redisKey);
          if (json == null) {
            return Option.none();
          }
          return Option.some(parseResetPasswordTokenRecord(json));
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "consumeResetPasswordToken",
            cause,
          }),
      }),
  };
}

export const AuthRepositoryLive = Layer.effect(
  AuthRepository,
  makeAuthRepositoryEffect.pipe(Effect.map(AuthRepository.make)),
);

export const authRepositoryFactory = makeAuthRepository;
