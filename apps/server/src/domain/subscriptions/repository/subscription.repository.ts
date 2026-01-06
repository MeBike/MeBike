import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
  SubscriptionPackage,
  SubscriptionStatus,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { SubscriptionFilter, SubscriptionRow, SubscriptionSortField } from "../models";

import { ActiveSubscriptionExists, SubscriptionRepositoryError } from "../domain-errors";
import { selectSubscriptionRow, toSubscriptionRow } from "./subscription.mappers";

export type CreatePendingSubscriptionInput = {
  readonly userId: string;
  readonly packageName: SubscriptionPackage;
  readonly maxUsages: number | null;
  readonly price: bigint;
};

export type ActivateSubscriptionInput = {
  readonly subscriptionId: string;
  readonly activatedAt: Date;
  readonly expiresAt: Date;
};

export type SubscriptionRepo = {
  createPending: (
    input: CreatePendingSubscriptionInput,
  ) => Effect.Effect<SubscriptionRow, SubscriptionRepositoryError>;

  createPendingInTx: (
    tx: PrismaTypes.TransactionClient,
    input: CreatePendingSubscriptionInput,
  ) => Effect.Effect<SubscriptionRow, SubscriptionRepositoryError>;

  findById: (
    subscriptionId: string,
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  findByIdInTx: (
    tx: PrismaTypes.TransactionClient,
    subscriptionId: string,
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  findCurrentForUser: (
    userId: string,
    statuses: readonly SubscriptionStatus[],
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  findCurrentForUserInTx: (
    tx: PrismaTypes.TransactionClient,
    userId: string,
    statuses: readonly SubscriptionStatus[],
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  listForUser: (
    userId: string,
    filter: SubscriptionFilter,
    pageReq: PageRequest<SubscriptionSortField>,
  ) => Effect.Effect<PageResult<SubscriptionRow>, SubscriptionRepositoryError>;

  activate: (
    input: ActivateSubscriptionInput,
  ) => Effect.Effect<
    Option.Option<SubscriptionRow>,
    SubscriptionRepositoryError | ActiveSubscriptionExists
  >;

  activateInTx: (
    tx: PrismaTypes.TransactionClient,
    input: ActivateSubscriptionInput,
  ) => Effect.Effect<
    Option.Option<SubscriptionRow>,
    SubscriptionRepositoryError | ActiveSubscriptionExists
  >;

  incrementUsage: (
    subscriptionId: string,
    expectedUsageCount: number,
    amount: number,
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  incrementUsageInTx: (
    tx: PrismaTypes.TransactionClient,
    subscriptionId: string,
    expectedUsageCount: number,
    amount: number,
    statuses?: readonly SubscriptionStatus[],
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  markExpiredNow: (
    now: Date,
  ) => Effect.Effect<number, SubscriptionRepositoryError>;
};

export class SubscriptionRepository extends Context.Tag("SubscriptionRepository")<
  SubscriptionRepository,
  SubscriptionRepo
>() {}

function toSubscriptionOrderBy(
  req: PageRequest<SubscriptionSortField>,
): PrismaTypes.SubscriptionOrderByWithRelationInput {
  const sortBy = req.sortBy ?? "updatedAt";
  const sortDir = req.sortDir ?? "desc";
  switch (sortBy) {
    case "expiresAt":
      return { expiresAt: sortDir };
    case "status":
      return { status: sortDir };
    case "activatedAt":
      return { activatedAt: sortDir };
    case "packageName":
      return { packageName: sortDir };
    case "updatedAt":
    default:
      return { updatedAt: sortDir };
  }
}

export function makeSubscriptionRepository(client: PrismaClient): SubscriptionRepo {
  const findByIdWithClient = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    subscriptionId: string,
  ) =>
    Effect.tryPromise({
      try: () =>
        tx.subscription.findUnique({
          where: { id: subscriptionId },
          select: selectSubscriptionRow,
        }),
      catch: err =>
        new SubscriptionRepositoryError({
          operation: "findById",
          cause: err,
        }),
    }).pipe(
      Effect.map(row =>
        Option.fromNullable(row).pipe(Option.map(toSubscriptionRow)),
      ),
    );

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
      }).pipe(Effect.map(toSubscriptionRow)),

    createPendingInTx: (tx, input) =>
      Effect.tryPromise({
        try: () =>
          tx.subscription.create({
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
            operation: "createPendingInTx",
            cause: err,
          }),
      }).pipe(Effect.map(toSubscriptionRow)),

    findById: subscriptionId => findByIdWithClient(client, subscriptionId),

    findByIdInTx: (tx, subscriptionId) => findByIdWithClient(tx, subscriptionId),

    findCurrentForUser: (userId, statuses) =>
      Effect.tryPromise({
        try: () =>
          client.subscription.findFirst({
            where: {
              userId,
              status: { in: [...statuses] },
            },
            orderBy: { updatedAt: "desc" },
            select: selectSubscriptionRow,
          }),
        catch: err =>
          new SubscriptionRepositoryError({
            operation: "findCurrentForUser",
            message: `Failed to find current subscription for user ${userId}`,
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toSubscriptionRow)),
        ),
      ),

    findCurrentForUserInTx: (tx, userId, statuses) =>
      Effect.tryPromise({
        try: () =>
          tx.subscription.findFirst({
            where: {
              userId,
              status: { in: [...statuses] },
            },
            orderBy: { updatedAt: "desc" },
            select: selectSubscriptionRow,
          }),
        catch: err =>
          new SubscriptionRepositoryError({
            operation: "findCurrentForUserInTx",
            message: `Failed to find current subscription for user ${userId}`,
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toSubscriptionRow)),
        ),
      ),

    listForUser: (userId, filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where: PrismaTypes.SubscriptionWhereInput = {
          userId,
          ...(filter.status ? { status: filter.status } : {}),
        };

        const orderBy = toSubscriptionOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.subscription.count({ where }),
            catch: err =>
              new SubscriptionRepositoryError({
                operation: "listForUser.count",
                message: `Failed to count subscriptions for user ${userId}`,
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.subscription.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectSubscriptionRow,
              }),
            catch: err =>
              new SubscriptionRepositoryError({
                operation: "listForUser.findMany",
                cause: err,
              }),
          }),
        ]);

        const mapped = items.map(toSubscriptionRow);

        return makePageResult(mapped, total, page, pageSize);
      }),

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
          return Option.none<SubscriptionRow>();
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
      }),

    activateInTx: (tx, input) =>
      Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            tx.subscription.updateMany({
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
              operation: "activateInTx.update",
              cause: err,
            });
          },
        });

        if (updated.count === 0) {
          return Option.none<SubscriptionRow>();
        }

        const row = yield* Effect.tryPromise({
          try: () =>
            tx.subscription.findUnique({
              where: { id: input.subscriptionId },
              select: selectSubscriptionRow,
            }),
          catch: err =>
            new SubscriptionRepositoryError({
              operation: "activateInTx.find",
              cause: err,
            }),
        });

        return Option.fromNullable(row).pipe(Option.map(toSubscriptionRow));
      }),

    incrementUsage: (subscriptionId, expectedUsageCount, amount) =>
      Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            client.subscription.updateMany({
              where: {
                id: subscriptionId,
                status: "ACTIVE",
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
          return Option.none<SubscriptionRow>();
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
      }),

    incrementUsageInTx: (tx, subscriptionId, expectedUsageCount, amount, statuses = ["ACTIVE"]) =>
      Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            tx.subscription.updateMany({
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
              operation: "incrementUsageInTx.update",
              cause: err,
            }),
        });

        if (updated.count === 0) {
          return Option.none<SubscriptionRow>();
        }

        const row = yield* Effect.tryPromise({
          try: () =>
            tx.subscription.findUnique({
              where: { id: subscriptionId },
              select: selectSubscriptionRow,
            }),
          catch: err =>
            new SubscriptionRepositoryError({
              operation: "incrementUsageInTx.find",
              cause: err,
            }),
        });

        return Option.fromNullable(row).pipe(Option.map(toSubscriptionRow));
      }),

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
      }),
  };
}

export const SubscriptionRepositoryLive = Layer.effect(
  SubscriptionRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeSubscriptionRepository(client);
  }),
);
