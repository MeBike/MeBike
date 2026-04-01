import { Effect, Layer } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { AuthEventRepo } from "./auth.repository.types";

import { AuthEventRepositoryError } from "../domain-errors";

export type { AuthEventRepo } from "./auth.repository.types";

const makeAuthEventRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeAuthEventRepository(client);
});

export class AuthEventRepository extends Effect.Service<AuthEventRepository>()(
  "AuthEventRepository",
  {
    effect: makeAuthEventRepositoryEffect,
  },
) {}

export function makeAuthEventRepository(client: PrismaClient): AuthEventRepo {
  return {
    recordSessionIssued: ({ userId, occurredAt }) =>
      Effect.tryPromise({
        try: () =>
          client.authEvent.create({
            data: {
              userId,
              occurredAt,
            },
          }),
        catch: err =>
          new AuthEventRepositoryError({
            operation: "recordSessionIssued",
            cause: err,
          }),
      }).pipe(
        Effect.map(() => undefined),
        Effect.orDieWith(error => error),
      ),
  };
}

export const AuthEventRepositoryLive = Layer.effect(
  AuthEventRepository,
  makeAuthEventRepositoryEffect.pipe(Effect.map(AuthEventRepository.make)),
);
