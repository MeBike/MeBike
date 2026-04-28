import { Context, Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
  WalletTransactionStatus,
  WalletTransactionType,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { DecreaseBalanceInput, IncreaseBalanceInput, WalletRow } from "../models";

import {
  WalletBalanceConstraint,
  WalletRecordNotFound,
  WalletRepositoryError,
  WalletUniqueViolation,
} from "../domain-errors";
import { selectWalletRow, toWalletRow } from "./wallet.mappers";

export type WalletCommandRepo = {
  createForUser: (userId: string) => Effect.Effect<WalletRow, WalletUniqueViolation>;
  increaseBalance: (
    input: IncreaseBalanceInput,
  ) => Effect.Effect<WalletRow, WalletRecordNotFound | WalletUniqueViolation>;
  decreaseBalance: (input: DecreaseBalanceInput) => Effect.Effect<
    WalletRow,
    WalletRecordNotFound | WalletBalanceConstraint
  >;
  reserveBalance: (
    input: { readonly walletId: string; readonly amount: bigint },
  ) => Effect.Effect<boolean>;
  releaseReservedBalance: (
    input: { readonly walletId: string; readonly amount: bigint },
  ) => Effect.Effect<boolean>;
};

export class WalletCommandRepository extends Context.Tag("WalletCommandRepository")<
  WalletCommandRepository,
  WalletCommandRepo
>() {}

async function findWalletByUserId(
  tx: PrismaClient | PrismaTypes.TransactionClient,
  userId: string,
) {
  return tx.wallet.findUnique({
    where: { userId },
    select: selectWalletRow,
  });
}

async function createTransaction(
  tx: PrismaClient | PrismaTypes.TransactionClient,
  args: {
    walletId: string;
    amount: bigint;
    fee: bigint;
    description?: string | null;
    hash?: string | null;
    type: WalletTransactionType;
    status: WalletTransactionStatus;
  },
) {
  return tx.walletTransaction.create({
    data: {
      walletId: args.walletId,
      amount: args.amount,
      fee: args.fee,
      description: args.description ?? null,
      hash: args.hash ?? null,
      type: args.type,
      status: args.status,
    },
    select: { id: true },
  });
}

export function makeWalletCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): WalletCommandRepo {
  const runInTransaction = async <T>(
    operation: (tx: PrismaClient | PrismaTypes.TransactionClient) => Promise<T>,
  ) => {
    if ("$transaction" in client) {
      return client.$transaction(async tx => operation(tx));
    }
    return operation(client);
  };

  return {
    createForUser: userId =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.wallet.create({
            data: {
              userId,
            },
            select: selectWalletRow,
          });
          return toWalletRow(row);
        },
        catch: (err) => {
          if (isPrismaUniqueViolation(err)) {
            return new WalletUniqueViolation({ operation: "createForUser", constraint: "wallet.userId", userId });
          }
          return new WalletRepositoryError({ operation: "createForUser", cause: err });
        },
      }).pipe(defectOn(WalletRepositoryError)),

    increaseBalance: input =>
      Effect.tryPromise({
        try: async () => {
          const amount = input.amount;
          const fee = input.fee ?? 0n;
          const net = amount - fee;
          const txType: WalletTransactionType = input.type ?? "DEPOSIT";
          const txStatus: WalletTransactionStatus = "SUCCESS";

          const updated = await runInTransaction(async (tx) => {
            const wallet = await findWalletByUserId(tx, input.userId);
            if (!wallet) {
              throw new WalletRecordNotFound({ operation: "increaseBalance.findWallet", userId: input.userId });
            }

            const bumped = await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: { increment: net },
              },
              select: selectWalletRow,
            });

            await createTransaction(tx, {
              walletId: wallet.id,
              amount,
              fee,
              description: input.description ?? null,
              hash: input.hash ?? null,
              type: txType,
              status: txStatus,
            });

            return bumped;
          });

          return toWalletRow(updated);
        },
        catch: (err) => {
          if (err instanceof WalletRecordNotFound)
            return err;
          if (isPrismaUniqueViolation(err)) {
            return new WalletUniqueViolation({
              operation: "increaseBalance",
              constraint: "wallet_transactions.hash",
            });
          }
          return new WalletRepositoryError({ operation: "increaseBalance", cause: err });
        },
      }).pipe(defectOn(WalletRepositoryError)),

    decreaseBalance: input =>
      Effect.tryPromise({
        try: async () => {
          const amount = input.amount;
          const txType: WalletTransactionType = input.type ?? "DEBIT";
          const txStatus: WalletTransactionStatus = "SUCCESS";

          const updated = await runInTransaction(async (tx) => {
            const wallet = await findWalletByUserId(tx, input.userId);
            if (!wallet) {
              throw new WalletRecordNotFound({ operation: "decreaseBalance.findWallet", userId: input.userId });
            }

            const changed = await tx.$executeRaw`UPDATE "wallets"
              SET "balance" = "balance" - ${amount}
              WHERE "id" = ${wallet.id}
                AND "balance" - "reserved_balance" >= ${amount}`;

            if (changed === 0) {
              throw new WalletBalanceConstraint({
                operation: "decreaseBalance.updateBalance",
                walletId: wallet.id,
                userId: input.userId,
                balance: wallet.balance - wallet.reservedBalance,
                attemptedDebit: amount,
              });
            }

            const refreshed = await tx.wallet.findUnique({
              where: { id: wallet.id },
              select: selectWalletRow,
            });

            await createTransaction(tx, {
              walletId: wallet.id,
              amount,
              fee: 0n,
              description: input.description ?? null,
              hash: input.hash ?? null,
              type: txType,
              status: txStatus,
            });

            return refreshed;
          });

          return toWalletRow(updated!);
        },
        catch: (err) => {
          if (err instanceof WalletRecordNotFound || err instanceof WalletBalanceConstraint) {
            return err;
          }
          return new WalletRepositoryError({ operation: "decreaseBalance", cause: err });
        },
      }).pipe(defectOn(WalletRepositoryError)),

    reserveBalance: input =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.$executeRaw`UPDATE "wallets"
            SET "reserved_balance" = "reserved_balance" + ${input.amount}
            WHERE "id" = ${input.walletId}
              AND "balance" - "reserved_balance" >= ${input.amount}`;
          return updated > 0;
        },
        catch: err =>
          new WalletRepositoryError({
            operation: "reserveBalance",
            cause: err,
          }),
      }).pipe(defectOn(WalletRepositoryError)),

    releaseReservedBalance: input =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.wallet.updateMany({
            where: {
              id: input.walletId,
              reservedBalance: { gte: input.amount },
            },
            data: {
              reservedBalance: { decrement: input.amount },
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WalletRepositoryError({
            operation: "releaseReservedBalance",
            cause: err,
          }),
      }).pipe(defectOn(WalletRepositoryError)),
  };
}

export const WalletCommandRepositoryLive = Layer.effect(
  WalletCommandRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeWalletCommandRepository(client);
  }),
);
