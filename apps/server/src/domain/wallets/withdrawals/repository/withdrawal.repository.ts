import { Effect, Layer, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { getPrismaUniqueViolationTarget, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import { WalletWithdrawalStatus } from "generated/prisma/client";

import type {
  CreateWalletWithdrawalInput,
  MarkWithdrawalProcessingInput,
  MarkWithdrawalResultInput,
  WalletWithdrawalRow,
} from "../models";

import { WithdrawalRepositoryError, WithdrawalUniqueViolation } from "../domain-errors";

const selectWithdrawalRow = {
  id: true,
  userId: true,
  walletId: true,
  amount: true,
  currency: true,
  status: true,
  idempotencyKey: true,
  stripeTransferId: true,
  stripePayoutId: true,
  failureReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.WalletWithdrawalSelect;

function toWithdrawalRow(
  row: PrismaTypes.WalletWithdrawalGetPayload<{ select: typeof selectWithdrawalRow }>,
): WalletWithdrawalRow {
  return {
    id: row.id,
    userId: row.userId,
    walletId: row.walletId,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    idempotencyKey: row.idempotencyKey,
    stripeTransferId: row.stripeTransferId,
    stripePayoutId: row.stripePayoutId,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type WithdrawalRepositoryType = {
  createPending: (
    input: CreateWalletWithdrawalInput,
  ) => Effect.Effect<WalletWithdrawalRow, WithdrawalRepositoryError | WithdrawalUniqueViolation>;
  createPendingInTx: (
    tx: PrismaTypes.TransactionClient,
    input: CreateWalletWithdrawalInput,
  ) => Effect.Effect<WalletWithdrawalRow, WithdrawalRepositoryError | WithdrawalUniqueViolation>;
  findById: (id: string) => Effect.Effect<Option.Option<WalletWithdrawalRow>, WithdrawalRepositoryError>;
  findByIdInTx: (
    tx: PrismaTypes.TransactionClient,
    id: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>, WithdrawalRepositoryError>;
  findByStripePayoutId: (
    payoutId: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>, WithdrawalRepositoryError>;
  findProcessingBefore: (
    createdBefore: Date,
    limit: number,
  ) => Effect.Effect<ReadonlyArray<WalletWithdrawalRow>, WithdrawalRepositoryError>;
  findByIdempotencyKey: (
    idempotencyKey: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>, WithdrawalRepositoryError>;
  markProcessing: (
    input: MarkWithdrawalProcessingInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  markProcessingInTx: (
    tx: PrismaTypes.TransactionClient,
    input: MarkWithdrawalProcessingInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  setStripeRefs: (
    input: import("../models").UpdateWithdrawalStripeRefsInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  setStripeRefsInTx: (
    tx: PrismaTypes.TransactionClient,
    input: import("../models").UpdateWithdrawalStripeRefsInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  markSucceeded: (
    input: MarkWithdrawalResultInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  markSucceededInTx: (
    tx: PrismaTypes.TransactionClient,
    input: MarkWithdrawalResultInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  markFailed: (
    input: MarkWithdrawalResultInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  markFailedInTx: (
    tx: PrismaTypes.TransactionClient,
    input: MarkWithdrawalResultInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
};

const makeWithdrawalRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeWithdrawalRepository(client);
});

export class WithdrawalRepository extends Effect.Service<WithdrawalRepository>()(
  "WithdrawalRepository",
  {
    effect: makeWithdrawalRepositoryEffect,
  },
) {}

function toUniqueViolation(err: unknown, operation: string): WithdrawalUniqueViolation | null {
  if (!isPrismaUniqueViolation(err)) {
    return null;
  }
  return new WithdrawalUniqueViolation({
    operation,
    constraint: getPrismaUniqueViolationTarget(err),
    cause: err,
  });
}

async function insertWithdrawal(
  tx: PrismaClient | PrismaTypes.TransactionClient,
  input: CreateWalletWithdrawalInput,
) {
  return tx.walletWithdrawal.create({
    data: {
      userId: input.userId,
      walletId: input.walletId,
      amount: input.amount,
      currency: input.currency,
      status: "PENDING",
      idempotencyKey: input.idempotencyKey,
    },
    select: selectWithdrawalRow,
  });
}

async function findByIdempotencyKey(
  tx: PrismaClient | PrismaTypes.TransactionClient,
  idempotencyKey: string,
) {
  return tx.walletWithdrawal.findFirst({
    where: { idempotencyKey },
    select: selectWithdrawalRow,
  });
}

export function makeWithdrawalRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): WithdrawalRepositoryType {
  return {
    createPending: input =>
      Effect.tryPromise({
        try: async () => {
          try {
            const row = await insertWithdrawal(client, input);
            return toWithdrawalRow(row);
          }
          catch (err) {
            if (isPrismaUniqueViolation(err)) {
              const existing = await findByIdempotencyKey(client, input.idempotencyKey);
              if (existing) {
                return toWithdrawalRow(existing);
              }
            }
            throw err;
          }
        },
        catch: (err) => {
          const uniqueViolation = toUniqueViolation(err, "createPending");
          if (uniqueViolation) {
            // TODO(tests): add integration coverage for idempotency unique violations.
            return uniqueViolation;
          }
          return new WithdrawalRepositoryError({
            operation: "createPending",
            cause: err,
          });
        },
      }),

    createPendingInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          try {
            const row = await insertWithdrawal(tx, input);
            return toWithdrawalRow(row);
          }
          catch (err) {
            if (isPrismaUniqueViolation(err)) {
              const existing = await findByIdempotencyKey(tx, input.idempotencyKey);
              if (existing) {
                return toWithdrawalRow(existing);
              }
            }
            throw err;
          }
        },
        catch: (err) => {
          const uniqueViolation = toUniqueViolation(err, "createPendingInTx");
          if (uniqueViolation) {
            return uniqueViolation;
          }
          return new WithdrawalRepositoryError({
            operation: "createPendingInTx",
            cause: err,
          });
        },
      }),

    findById: id =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletWithdrawal.findUnique({
            where: { id },
            select: selectWithdrawalRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWithdrawalRow));
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "findById",
            cause: err,
          }),
      }),

    findByIdInTx: (tx, id) =>
      Effect.tryPromise({
        try: async () => {
          const row = await tx.walletWithdrawal.findUnique({
            where: { id },
            select: selectWithdrawalRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWithdrawalRow));
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "findByIdInTx",
            cause: err,
          }),
      }),

    findByStripePayoutId: payoutId =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletWithdrawal.findFirst({
            where: { stripePayoutId: payoutId },
            select: selectWithdrawalRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWithdrawalRow));
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "findByStripePayoutId",
            cause: err,
          }),
      }),
    findProcessingBefore: (createdBefore, limit) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await client.walletWithdrawal.findMany({
            where: {
              status: "PROCESSING",
              createdAt: { lte: createdBefore },
            },
            orderBy: { createdAt: "asc" },
            take: limit,
            select: selectWithdrawalRow,
          });
          return rows.map(toWithdrawalRow);
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "findProcessingBefore",
            cause: err,
          }),
      }),

    findByIdempotencyKey: idempotencyKey =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletWithdrawal.findFirst({
            where: { idempotencyKey },
            select: selectWithdrawalRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWithdrawalRow));
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "findByIdempotencyKey",
            cause: err,
          }),
      }),

    markProcessing: input =>
      Effect.tryPromise({
        try: async () => {
          const where: PrismaTypes.WalletWithdrawalWhereInput = input.staleBefore
            ? {
                OR: [
                  { id: input.withdrawalId, status: WalletWithdrawalStatus.PENDING },
                  {
                    id: input.withdrawalId,
                    status: WalletWithdrawalStatus.PROCESSING,
                    updatedAt: { lte: input.staleBefore },
                  },
                ],
              }
            : { id: input.withdrawalId, status: WalletWithdrawalStatus.PENDING };

          const updated = await client.walletWithdrawal.updateMany({
            where,
            data: {
              status: "PROCESSING",
              stripeTransferId: input.stripeTransferId ?? undefined,
              stripePayoutId: input.stripePayoutId ?? undefined,
              failureReason: null,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "markProcessing",
            cause: err,
          }),
      }),

    markProcessingInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          const where: PrismaTypes.WalletWithdrawalWhereInput = input.staleBefore
            ? {
                OR: [
                  { id: input.withdrawalId, status: WalletWithdrawalStatus.PENDING },
                  {
                    id: input.withdrawalId,
                    status: WalletWithdrawalStatus.PROCESSING,
                    updatedAt: { lte: input.staleBefore },
                  },
                ],
              }
            : { id: input.withdrawalId, status: WalletWithdrawalStatus.PENDING };

          const updated = await tx.walletWithdrawal.updateMany({
            where,
            data: {
              status: "PROCESSING",
              stripeTransferId: input.stripeTransferId ?? undefined,
              stripePayoutId: input.stripePayoutId ?? undefined,
              failureReason: null,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "markProcessingInTx",
            cause: err,
          }),
      }),

    setStripeRefs: input =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletWithdrawal.updateMany({
            where: { id: input.withdrawalId, status: "PROCESSING" },
            data: {
              stripeTransferId: input.stripeTransferId ?? undefined,
              stripePayoutId: input.stripePayoutId ?? undefined,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "setStripeRefs",
            cause: err,
          }),
      }),

    setStripeRefsInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.walletWithdrawal.updateMany({
            where: { id: input.withdrawalId, status: "PROCESSING" },
            data: {
              stripeTransferId: input.stripeTransferId ?? undefined,
              stripePayoutId: input.stripePayoutId ?? undefined,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "setStripeRefsInTx",
            cause: err,
          }),
      }),

    markSucceeded: input =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletWithdrawal.updateMany({
            where: { id: input.withdrawalId, status: { in: ["PENDING", "PROCESSING"] } },
            data: {
              status: "SUCCEEDED",
              stripePayoutId: input.stripePayoutId ?? undefined,
              failureReason: null,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "markSucceeded",
            cause: err,
          }),
      }),

    markSucceededInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.walletWithdrawal.updateMany({
            where: { id: input.withdrawalId, status: { in: ["PENDING", "PROCESSING"] } },
            data: {
              status: "SUCCEEDED",
              stripePayoutId: input.stripePayoutId ?? undefined,
              failureReason: null,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "markSucceededInTx",
            cause: err,
          }),
      }),

    markFailed: input =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletWithdrawal.updateMany({
            where: { id: input.withdrawalId, status: { in: ["PENDING", "PROCESSING"] } },
            data: {
              status: "FAILED",
              stripePayoutId: input.stripePayoutId ?? undefined,
              failureReason: input.failureReason ?? null,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "markFailed",
            cause: err,
          }),
      }),

    markFailedInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.walletWithdrawal.updateMany({
            where: { id: input.withdrawalId, status: { in: ["PENDING", "PROCESSING"] } },
            data: {
              status: "FAILED",
              stripePayoutId: input.stripePayoutId ?? undefined,
              failureReason: input.failureReason ?? null,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "markFailedInTx",
            cause: err,
          }),
      }),
  };
}

export const WithdrawalRepositoryLive = Layer.effect(
  WithdrawalRepository,
  makeWithdrawalRepositoryEffect.pipe(Effect.map(WithdrawalRepository.make)),
);
