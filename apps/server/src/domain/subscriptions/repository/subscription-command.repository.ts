import { Effect, Layer, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { SubscriptionCommandRepo } from "./subscription.repository.types";

import { ActiveSubscriptionExists, SubscriptionRepositoryError } from "../domain-errors";
import { selectSubscriptionRow, toSubscriptionRow } from "./subscription.mappers";

/**
 * Tạo command repository cho subscriptions từ Prisma client hoặc transaction client.
 * Tất cả thao tác ghi của module đều nên đi qua factory này để giữ semantics đồng nhất.
 */
export function makeSubscriptionCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): SubscriptionCommandRepo {
  return {
    createPending: input =>
      Effect.tryPromise({
        try: () =>
          client.subscription.create({
            data: {
              userId: input.userId,
              packageName: input.packageName,
              maxUsages: input.maxUsages,
              price: input.price,
              status: "PENDING",
            },
            select: selectSubscriptionRow,
          }),
        catch: err =>
          new SubscriptionRepositoryError({
            operation: "createPending",
            cause: err,
          }),
      }).pipe(
        Effect.map(toSubscriptionRow),
        defectOn(SubscriptionRepositoryError),
      ),

    activate: input =>
      Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            client.subscription.updateMany({
              where: {
                id: input.subscriptionId,
                status: "PENDING",
              },
              data: {
                status: "ACTIVE",
                activatedAt: input.activatedAt,
                expiresAt: input.expiresAt,
                updatedAt: input.activatedAt,
              },
            }),
          catch: (err) => {
            if (isPrismaUniqueViolation(err)) {
              return new ActiveSubscriptionExists({
                subscriptionId: input.subscriptionId,
              });
            }
            return new SubscriptionRepositoryError({
              operation: "activate.update",
              cause: err,
            });
          },
        });

        if (updated.count === 0) {
          return Option.none();
        }

        const row = yield* Effect.tryPromise({
          try: () =>
            client.subscription.findUnique({
              where: { id: input.subscriptionId },
              select: selectSubscriptionRow,
            }),
          catch: err =>
            new SubscriptionRepositoryError({
              operation: "activate.find",
              cause: err,
            }),
        });

        return Option.fromNullable(row).pipe(Option.map(toSubscriptionRow));
      }).pipe(defectOn(SubscriptionRepositoryError)),

    incrementUsage: (subscriptionId, expectedUsageCount, amount, statuses = ["ACTIVE"]) =>
      Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            client.subscription.updateMany({
              where: {
                id: subscriptionId,
                status: { in: [...statuses] },
                usageCount: expectedUsageCount,
              },
              data: {
                usageCount: { increment: amount },
                updatedAt: new Date(),
              },
            }),
          catch: err =>
            new SubscriptionRepositoryError({
              operation: "incrementUsage.update",
              cause: err,
            }),
        });

        if (updated.count === 0) {
          return Option.none();
        }

        const row = yield* Effect.tryPromise({
          try: () =>
            client.subscription.findUnique({
              where: { id: subscriptionId },
              select: selectSubscriptionRow,
            }),
          catch: err =>
            new SubscriptionRepositoryError({
              operation: "incrementUsage.find",
              cause: err,
            }),
        });

        return Option.fromNullable(row).pipe(Option.map(toSubscriptionRow));
      }).pipe(defectOn(SubscriptionRepositoryError)),

    markExpiredNow: now =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.subscription.updateMany({
            where: {
              status: "ACTIVE",
              expiresAt: { lte: now },
            },
            data: {
              status: "EXPIRED",
              updatedAt: now,
            },
          });
          return updated.count;
        },
        catch: err =>
          new SubscriptionRepositoryError({
            operation: "markExpiredNow",
            cause: err,
          }),
      }).pipe(defectOn(SubscriptionRepositoryError)),
  };
}

const makeSubscriptionCommandRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeSubscriptionCommandRepository(client);
});

export class SubscriptionCommandRepository extends Effect.Service<SubscriptionCommandRepository>()(
  "SubscriptionCommandRepository",
  {
    effect: makeSubscriptionCommandRepositoryEffect,
  },
) {}

export const SubscriptionCommandRepositoryLive = Layer.effect(
  SubscriptionCommandRepository,
  makeSubscriptionCommandRepositoryEffect.pipe(Effect.map(SubscriptionCommandRepository.make)),
);
