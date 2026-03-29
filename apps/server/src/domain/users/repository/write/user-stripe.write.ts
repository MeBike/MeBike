import { Effect, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { isPrismaRecordNotFound } from "@/infrastructure/prisma-errors";

import type { UserRepo } from "../user.repository.types";

import { selectUserRow, toUserRow } from "../user.mappers";
import { toUserRepositoryError } from "./user-write.shared";

export type UserStripeWriteRepo = Pick<
  UserRepo,
  | "setStripeConnectedAccountId"
  | "setStripeConnectedAccountIdIfNull"
  | "setStripePayoutsEnabled"
  | "setStripePayoutsEnabledByAccountId"
>;

export function makeUserStripeWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): UserStripeWriteRepo {
  return {
    setStripeConnectedAccountId: (id, accountId) =>
      Effect.tryPromise({
        try: () =>
          client.user.update({
            where: { id },
            data: {
              stripeConnectedAccountId: accountId,
            },
            select: selectUserRow,
          }),
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll((err) => {
          if (isPrismaRecordNotFound(err)) {
            return Effect.succeed(null);
          }

          return Effect.fail(toUserRepositoryError("setStripeConnectedAccountId", err));
        }),
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    setStripeConnectedAccountIdIfNull: (id, accountId) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.user.updateMany({
            where: {
              id,
              stripeConnectedAccountId: null,
            },
            data: {
              stripeConnectedAccountId: accountId,
            },
          });

          if (updated.count === 0) {
            return null;
          }

          return client.user.findUnique({
            where: { id },
            select: selectUserRow,
          });
        },
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll(err =>
          Effect.fail(toUserRepositoryError("setStripeConnectedAccountIdIfNull", err)),
        ),
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    setStripePayoutsEnabled: (id, enabled) =>
      Effect.tryPromise({
        try: () =>
          client.user.update({
            where: { id },
            data: {
              stripePayoutsEnabled: enabled,
            },
            select: selectUserRow,
          }),
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll((err) => {
          if (isPrismaRecordNotFound(err)) {
            return Effect.succeed(null);
          }

          return Effect.fail(toUserRepositoryError("setStripePayoutsEnabled", err));
        }),
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    setStripePayoutsEnabledByAccountId: (accountId, enabled) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.user.updateMany({
            where: { stripeConnectedAccountId: accountId },
            data: { stripePayoutsEnabled: enabled },
          });

          return updated.count > 0;
        },
        catch: err => toUserRepositoryError("setStripePayoutsEnabledByAccountId", err),
      }),
  };
}
