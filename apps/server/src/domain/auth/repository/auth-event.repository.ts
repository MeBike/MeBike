import { Effect } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import { AuthEventRepositoryError } from "../domain-errors";

export type AuthEventRepo = {
  readonly recordSessionIssued: (
    args: { userId: string; occurredAt: Date },
  ) => Effect.Effect<void, AuthEventRepositoryError>;
};

export class AuthEventRepository extends Effect.Service<AuthEventRepository>()(
  "AuthEventRepository",
  {
    effect: Effect.gen(function* () {
      const { client } = yield* Prisma;
      return makeAuthEventRepository(client);
    }),
    dependencies: [Prisma.Default],
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
      }).pipe(Effect.map(() => undefined)),
  };
}

export const AuthEventRepositoryLive = AuthEventRepository.Default;
