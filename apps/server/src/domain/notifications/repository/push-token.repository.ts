import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { PushTokenRow, RegisterPushTokenInput } from "../models";

import { PushTokenRepositoryError } from "../domain-errors";

export type PushTokenRepo = {
  readonly upsertForUser: (
    input: RegisterPushTokenInput,
  ) => Effect.Effect<PushTokenRow, PushTokenRepositoryError>;
  readonly deactivateForUser: (
    userId: string,
    token: string,
  ) => Effect.Effect<boolean, PushTokenRepositoryError>;
  readonly deactivateAllForUser: (
    userId: string,
  ) => Effect.Effect<number, PushTokenRepositoryError>;
  readonly listActiveByUserId: (
    userId: string,
  ) => Effect.Effect<readonly PushTokenRow[], PushTokenRepositoryError>;
};

const selectPushTokenRow = {
  id: true,
  userId: true,
  token: true,
  platform: true,
  deviceId: true,
  appVersion: true,
  isActive: true,
  lastSeenAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function makePushTokenRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): PushTokenRepo {
  const client = db;

  return {
    upsertForUser: input =>
      Effect.tryPromise({
        try: () => {
          const now = new Date();
          return client.pushToken.upsert({
            where: { token: input.token },
            update: {
              userId: input.userId,
              platform: input.platform ?? "UNKNOWN",
              deviceId: input.deviceId ?? null,
              appVersion: input.appVersion ?? null,
              isActive: true,
              lastSeenAt: now,
              updatedAt: now,
            },
            create: {
              userId: input.userId,
              token: input.token,
              platform: input.platform ?? "UNKNOWN",
              deviceId: input.deviceId ?? null,
              appVersion: input.appVersion ?? null,
              isActive: true,
              lastSeenAt: now,
            },
            select: selectPushTokenRow,
          });
        },
        catch: cause =>
          new PushTokenRepositoryError({
            operation: "upsertForUser",
            cause,
          }),
      }),

    deactivateForUser: (userId, token) =>
      Effect.tryPromise({
        try: async () => {
          const result = await client.pushToken.updateMany({
            where: {
              userId,
              token,
              isActive: true,
            },
            data: {
              isActive: false,
              updatedAt: new Date(),
            },
          });
          return result.count > 0;
        },
        catch: cause =>
          new PushTokenRepositoryError({
            operation: "deactivateForUser",
            cause,
          }),
      }),

    deactivateAllForUser: userId =>
      Effect.tryPromise({
        try: async () => {
          const result = await client.pushToken.updateMany({
            where: {
              userId,
              isActive: true,
            },
            data: {
              isActive: false,
              updatedAt: new Date(),
            },
          });
          return result.count;
        },
        catch: cause =>
          new PushTokenRepositoryError({
            operation: "deactivateAllForUser",
            cause,
          }),
      }),

    listActiveByUserId: userId =>
      Effect.tryPromise({
        try: () =>
          client.pushToken.findMany({
            where: {
              userId,
              isActive: true,
            },
            select: selectPushTokenRow,
            orderBy: { updatedAt: "desc" },
          }),
        catch: cause =>
          new PushTokenRepositoryError({
            operation: "listActiveByUserId",
            cause,
          }),
      }),
  };
}

const makePushTokenRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makePushTokenRepository(client);
});

export class PushTokenRepository extends Effect.Service<PushTokenRepository>()(
  "PushTokenRepository",
  {
    effect: makePushTokenRepositoryEffect,
  },
) {}

export const PushTokenRepositoryLive = Layer.effect(
  PushTokenRepository,
  makePushTokenRepositoryEffect.pipe(Effect.map(PushTokenRepository.make)),
);
