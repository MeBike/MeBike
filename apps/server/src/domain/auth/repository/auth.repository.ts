import { Effect, Option } from "effect";

import { Redis } from "@/infrastructure/redis";

import type { EmailOtpKind, EmailOtpRecord, RefreshSession } from "../models";

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
  readonly consumeEmailOtp: (params: {
    userId: string;
    kind: EmailOtpKind;
  }) => Effect.Effect<Option.Option<EmailOtpRecord>, AuthRepositoryError>;
};

export class AuthRepository extends Effect.Service<AuthRepository>()(
  "AuthRepository",
  {
    effect: Effect.gen(function* () {
      const { client } = yield* Redis;
      return makeAuthRepository(client);
    }),
    dependencies: [Redis.Default],
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

function ttlFromDate(date: Date): number {
  const ttlMs = date.getTime() - Date.now();
  return Math.max(1, Math.floor(ttlMs / 1000));
}
// TODO : IF somewhere or someone start using it EXPOT THIS oUT
const sessionKey = (sid: string) => `auth:session:${sid}`;
const userSessionsKey = (uid: string) => `auth:user-sessions:${uid}`;
const otpKey = (kind: EmailOtpKind, uid: string) => `auth:otp:${kind}:${uid}`;

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
          const redisKey = otpKey(record.kind, record.userId);
          const ttl = ttlFromDate(record.expiresAt);
          const recordJson = JSON.stringify(record);

          await client.setex(redisKey, ttl, recordJson);
        },
        catch: cause =>
          new AuthRepositoryError({
            operation: "saveEmailOtp",
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
  };
}

export const AuthRepositoryLive = AuthRepository.Default;

export const authRepositoryFactory = makeAuthRepository;
