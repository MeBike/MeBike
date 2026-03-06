import { Context, Effect, Layer } from "effect";

import type { PushTokenRepositoryError } from "../domain-errors";
import type { PushTokenRow, RegisterPushTokenInput } from "../models";

import { InvalidPushToken } from "../domain-errors";
import { PushTokenRepository } from "../repository/push-token.repository";

export type PushNotificationService = {
  readonly registerToken: (
    input: RegisterPushTokenInput,
  ) => Effect.Effect<PushTokenRow, InvalidPushToken | PushTokenRepositoryError>;
  readonly unregisterToken: (
    userId: string,
    token: string,
  ) => Effect.Effect<void, InvalidPushToken | PushTokenRepositoryError>;
  readonly unregisterAllTokens: (
    userId: string,
  ) => Effect.Effect<number, PushTokenRepositoryError>;
  readonly listActiveTokens: (
    userId: string,
  ) => Effect.Effect<readonly PushTokenRow[], PushTokenRepositoryError>;
};

export class PushNotificationServiceTag extends Context.Tag("PushNotificationService")<
  PushNotificationServiceTag,
  PushNotificationService
>() {}

function normalizeToken(token: string): string {
  return token.trim();
}

function ensureToken(token: string): Effect.Effect<string, InvalidPushToken> {
  const normalized = normalizeToken(token);
  if (!normalized) {
    return Effect.fail(new InvalidPushToken({}));
  }
  return Effect.succeed(normalized);
}

export const PushNotificationServiceLive = Layer.effect(
  PushNotificationServiceTag,
  Effect.gen(function* () {
    const repo = yield* PushTokenRepository;

    const service: PushNotificationService = {
      registerToken: input =>
        ensureToken(input.token).pipe(
          Effect.flatMap(token =>
            repo.upsertForUser({
              ...input,
              token,
            }),
          ),
        ),

      unregisterToken: (userId, token) =>
        ensureToken(token).pipe(
          Effect.flatMap(cleanedToken => repo.deactivateForUser(userId, cleanedToken)),
          Effect.asVoid,
        ),

      unregisterAllTokens: userId => repo.deactivateAllForUser(userId),

      listActiveTokens: userId => repo.listActiveByUserId(userId),
    };

    return service;
  }),
);
