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
  create: (
    input: CreateWalletHoldInput,
  ) => Effect.Effect<WalletHoldRow, WalletHoldRepositoryError>;
  findByWithdrawalId: (
    withdrawalId: string,
  ) => Effect.Effect<Option.Option<WalletHoldRow>, WalletHoldRepositoryError>;
  sumActiveAmountByWallet: (
    walletId: string,
  ) => Effect.Effect<bigint, WalletHoldRepositoryError>;
  releaseByWithdrawalId: (
    withdrawalId: string,
    releasedAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
  settleByWithdrawalId: (
    withdrawalId: string,
    settledAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
};

export class WalletHoldRepository extends Context.Tag("WalletHoldRepository")<
  WalletHoldRepository,
  WalletHoldRepo
>() {}

export function makeWalletHoldRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): WalletHoldRepo {
  return {
    create: input =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletHold.create({
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
            operation: "create",
            cause: err,
          }),
      }),

    findByWithdrawalId: withdrawalId =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletHold.findUnique({
            where: { withdrawalId },
            select: selectWalletHoldRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWalletHoldRow));
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "findByWithdrawalId",
            cause: err,
          }),
      }),

    sumActiveAmountByWallet: walletId =>
      Effect.tryPromise({
        try: async () => {
          const result = await client.walletHold.aggregate({
            where: { walletId, status: "ACTIVE" },
            _sum: { amount: true },
          });
          return result._sum.amount ?? 0n;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "sumActiveAmountByWallet",
            cause: err,
          }),
      }),

    releaseByWithdrawalId: (withdrawalId, releasedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletHold.updateMany({
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
            operation: "releaseByWithdrawalId",
            cause: err,
          }),
      }),

    settleByWithdrawalId: (withdrawalId, settledAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletHold.updateMany({
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
            operation: "settleByWithdrawalId",
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
