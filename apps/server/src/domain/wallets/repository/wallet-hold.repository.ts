import { Context, Effect, Layer, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { CreateWalletHoldInput, WalletHoldRow } from "../models";

import { WalletHoldRepositoryError } from "../domain-errors";

const selectWalletHoldRow = {
  id: true,
  walletId: true,
  withdrawalId: true,
  amount: true,
  status: true,
  reason: true,
  releasedAt: true,
  settledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.WalletHoldSelect;

function toWalletHoldRow(
  row: PrismaTypes.WalletHoldGetPayload<{ select: typeof selectWalletHoldRow }>,
): WalletHoldRow {
  return {
    id: row.id,
    walletId: row.walletId,
    withdrawalId: row.withdrawalId,
    amount: row.amount,
    status: row.status,
    reason: row.reason,
    releasedAt: row.releasedAt,
    settledAt: row.settledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type WalletHoldRepo = {
  createInTx: (
    tx: PrismaTypes.TransactionClient,
    input: CreateWalletHoldInput,
  ) => Effect.Effect<WalletHoldRow, WalletHoldRepositoryError>;
  findByWithdrawalIdInTx: (
    tx: PrismaTypes.TransactionClient,
    withdrawalId: string,
  ) => Effect.Effect<Option.Option<WalletHoldRow>, WalletHoldRepositoryError>;
  sumActiveAmountByWalletInTx: (
    tx: PrismaTypes.TransactionClient,
    walletId: string,
  ) => Effect.Effect<bigint, WalletHoldRepositoryError>;
  releaseByWithdrawalIdInTx: (
    tx: PrismaTypes.TransactionClient,
    withdrawalId: string,
    releasedAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
  settleByWithdrawalIdInTx: (
    tx: PrismaTypes.TransactionClient,
    withdrawalId: string,
    settledAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
};

export class WalletHoldRepository extends Context.Tag("WalletHoldRepository")<
  WalletHoldRepository,
  WalletHoldRepo
>() {}

export function makeWalletHoldRepository(_client: PrismaClient): WalletHoldRepo {
  return {
    createInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          const row = await tx.walletHold.create({
            data: {
              walletId: input.walletId,
              withdrawalId: input.withdrawalId,
              amount: input.amount,
              status: "ACTIVE",
              reason: input.reason ?? "WITHDRAWAL",
            },
            select: selectWalletHoldRow,
          });
          return toWalletHoldRow(row);
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "createInTx",
            cause: err,
          }),
      }),

    findByWithdrawalIdInTx: (tx, withdrawalId) =>
      Effect.tryPromise({
        try: async () => {
          const row = await tx.walletHold.findUnique({
            where: { withdrawalId },
            select: selectWalletHoldRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWalletHoldRow));
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "findByWithdrawalIdInTx",
            cause: err,
          }),
      }),

    sumActiveAmountByWalletInTx: (tx, walletId) =>
      Effect.tryPromise({
        try: async () => {
          const result = await tx.walletHold.aggregate({
            where: { walletId, status: "ACTIVE" },
            _sum: { amount: true },
          });
          return result._sum.amount ?? 0n;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "sumActiveAmountByWalletInTx",
            cause: err,
          }),
      }),

    releaseByWithdrawalIdInTx: (tx, withdrawalId, releasedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.walletHold.updateMany({
            where: { withdrawalId, status: "ACTIVE" },
            data: {
              status: "RELEASED",
              releasedAt,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "releaseByWithdrawalIdInTx",
            cause: err,
          }),
      }),

    settleByWithdrawalIdInTx: (tx, withdrawalId, settledAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.walletHold.updateMany({
            where: { withdrawalId, status: "ACTIVE" },
            data: {
              status: "SETTLED",
              settledAt,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "settleByWithdrawalIdInTx",
            cause: err,
          }),
      }),
  };
}

export const WalletHoldRepositoryLive = Layer.effect(
  WalletHoldRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeWalletHoldRepository(client);
  }),
);
