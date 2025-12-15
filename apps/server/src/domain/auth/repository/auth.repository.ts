import { Context, Effect, Layer, Option } from "effect";

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

export class AuthRepository extends Context.Tag("AuthRepository")<
  AuthRepository,
  AuthRepo
>() {}

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

function makeAuthRepository(client: import("ioredis").default): AuthRepo {
  return {
    saveSession: session =>
      Effect.tryPromise({
        try: async () => {
          const sessionKey = `auth:session:${session.sessionId}`;
          const userSessionsKey = `auth:user-sessions:${session.userId}`;
          const ttl = ttlFromDate(session.expiresAt);
          const sessionJson = JSON.stringify(session);

          await client.setex(sessionKey, ttl, sessionJson);
          await client.sadd(userSessionsKey, session.sessionId);
          await client.expire(userSessionsKey, ttl);
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
          const sessionKey = `auth:session:${sessionId}`;
          const json = await client.get(sessionKey);
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
          const sessionKey = `auth:session:${sessionId}`;
          await client.del(sessionKey);
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
          const userSessionsKey = `auth:user-sessions:${userId}`;
          const sessionIds = await client.smembers(userSessionsKey);

          if (sessionIds.length === 0) {
            return;
          }

          // Create a pipeline to delete all sessions and the user sessions set
          const pipeline = client.pipeline();

          for (const sessionId of sessionIds) {
            pipeline.del(`auth:session:${sessionId}`);
          }

          pipeline.del(userSessionsKey);

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
          const otpKey = `auth:otp:${record.kind}:${record.userId}`;
          const ttl = ttlFromDate(record.expiresAt);
          const recordJson = JSON.stringify(record);

          await client.setex(otpKey, ttl, recordJson);
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
          const otpKey = `auth:otp:${kind}:${userId}`;

          const json = await client.get(otpKey);

          if (json == null) {
            return Option.none();
          }

          const record = parseEmailOtpRecord(json);

          await client.del(otpKey);

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

export const AuthRepositoryLive = Layer.effect(
  AuthRepository,
  Effect.gen(function* () {
    const { client } = yield* Redis;
    return makeAuthRepository(client);
  }),
);

export const authRepositoryFactory = makeAuthRepository;
