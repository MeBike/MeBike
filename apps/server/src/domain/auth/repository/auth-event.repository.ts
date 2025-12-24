import { Context, Effect, Layer } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import { AuthEventRepositoryError } from "../domain-errors";

export type AuthEventRepo = {
  readonly recordSessionIssued: (
    args: { userId: string; occurredAt: Date },
  ) => Effect.Effect<void, AuthEventRepositoryError>;
};

export class AuthEventRepository extends Context.Tag("AuthEventRepository")<
  AuthEventRepository,
  AuthEventRepo
>() {}

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
      }).pipe(Effect.map(() => undefined)),
  };
}

export const AuthEventRepositoryLive = Layer.effect(
  AuthEventRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeAuthEventRepository(client);
  }),
);
