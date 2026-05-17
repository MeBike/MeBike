import { Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
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
import { selectWithdrawalRow, toWithdrawalRow } from "./withdrawal.mappers";

export type WithdrawalRepositoryType = {
  createPending: (
    input: CreateWalletWithdrawalInput,
  ) => Effect.Effect<WalletWithdrawalRow, WithdrawalUniqueViolation>;
  findById: (id: string) => Effect.Effect<Option.Option<WalletWithdrawalRow>>;
  findByStripePayoutId: (
    payoutId: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>>;
  listByUserId: (
    userId: string,
    pageReq: PageRequest<"createdAt">,
  ) => Effect.Effect<PageResult<WalletWithdrawalRow>>;
  findByIdForUser: (
    userId: string,
    withdrawalId: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>>;
  findProcessingBefore: (
    createdBefore: Date,
    limit: number,
  ) => Effect.Effect<ReadonlyArray<WalletWithdrawalRow>>;
  findByIdempotencyKey: (
    idempotencyKey: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>>;
  markProcessing: (
    input: MarkWithdrawalProcessingInput,
  ) => Effect.Effect<boolean>;
  setStripeRefs: (
    input: import("../models").UpdateWithdrawalStripeRefsInput,
  ) => Effect.Effect<boolean>;
  markSucceeded: (
    input: MarkWithdrawalResultInput,
  ) => Effect.Effect<boolean>;
  markFailed: (
    input: MarkWithdrawalResultInput,
  ) => Effect.Effect<boolean>;
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
      payoutAmount: input.payoutAmount ?? null,
      payoutCurrency: input.payoutCurrency ?? null,
      fxRate: input.fxRate ?? null,
      fxQuotedAt: input.fxQuotedAt ?? null,
      status: "PENDING",
      idempotencyKey: input.idempotencyKey,
    },
    select: selectWithdrawalRow,
  });
}

export function makeWithdrawalRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): WithdrawalRepositoryType {
  return {
    createPending: input =>
      Effect.tryPromise({
        try: async () => toWithdrawalRow(await insertWithdrawal(client, input)),
        catch: (err) => {
          const uniqueViolation = toUniqueViolation(err, "createPending");
          if (uniqueViolation) {
            return uniqueViolation;
          }
          return new WithdrawalRepositoryError({
            operation: "createPending",
            cause: err,
          });
        },
      }).pipe(defectOn(WithdrawalRepositoryError)),

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
      }).pipe(defectOn(WithdrawalRepositoryError)),

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
      }).pipe(defectOn(WithdrawalRepositoryError)),

    listByUserId: (userId, pageReq) => {
      const { page, pageSize, skip, take } = normalizedPage(pageReq);

      return Effect.gen(function* () {
        const where = { userId } satisfies PrismaTypes.WalletWithdrawalWhereInput;

        const [total, rows] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.walletWithdrawal.count({ where }),
            catch: err =>
              new WithdrawalRepositoryError({
                operation: "listByUserId.count",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.walletWithdrawal.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take,
                select: selectWithdrawalRow,
              }),
            catch: err =>
              new WithdrawalRepositoryError({
                operation: "listByUserId.findMany",
                cause: err,
              }),
          }),
        ]);

        return makePageResult(rows.map(toWithdrawalRow), total, page, pageSize);
      }).pipe(defectOn(WithdrawalRepositoryError));
    },

    findByIdForUser: (userId, withdrawalId) =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletWithdrawal.findFirst({
            where: { id: withdrawalId, userId },
            select: selectWithdrawalRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWithdrawalRow));
        },
        catch: err =>
          new WithdrawalRepositoryError({
            operation: "findByIdForUser",
            cause: err,
          }),
      }).pipe(defectOn(WithdrawalRepositoryError)),

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
      }).pipe(defectOn(WithdrawalRepositoryError)),

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
      }).pipe(defectOn(WithdrawalRepositoryError)),

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
      }).pipe(defectOn(WithdrawalRepositoryError)),

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
      }).pipe(defectOn(WithdrawalRepositoryError)),

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
      }).pipe(defectOn(WithdrawalRepositoryError)),

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
      }).pipe(defectOn(WithdrawalRepositoryError)),

  };
}

export const WithdrawalRepositoryLive = Layer.effect(
  WithdrawalRepository,
  makeWithdrawalRepositoryEffect.pipe(Effect.map(WithdrawalRepository.make)),
);
