import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
  WalletTransactionStatus,
  WalletTransactionType,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type {
  DecreaseBalanceInput,
  IncreaseBalanceInput,
  WalletRow,
  WalletTransactionRow,
} from "../models";

import {
  WalletBalanceConstraint,
  WalletRecordNotFound,
  WalletRepositoryError,
  WalletUniqueViolation,
} from "../domain-errors";
import { selectWalletRow, selectWalletTransactionRow, toWalletRow, toWalletTransactionRow } from "./wallet.mappers";

export type WalletRepo = {
  findByUserId: (userId: string) => Effect.Effect<Option.Option<WalletRow>, WalletRepositoryError>;
  findByUserIdInTx: (
    tx: PrismaTypes.TransactionClient,
    userId: string,
  ) => Effect.Effect<Option.Option<WalletRow>, WalletRepositoryError>;
  createForUser: (userId: string) => Effect.Effect<WalletRow, WalletUniqueViolation | WalletRepositoryError>;
  createForUserInTx: (
    tx: PrismaTypes.TransactionClient,
    userId: string,
  ) => Effect.Effect<WalletRow, WalletUniqueViolation | WalletRepositoryError>;
  increaseBalance: (
    input: IncreaseBalanceInput,
  ) => Effect.Effect<WalletRow, WalletRecordNotFound | WalletUniqueViolation | WalletRepositoryError>;
  increaseBalanceInTx: (
    tx: PrismaTypes.TransactionClient,
    input: IncreaseBalanceInput,
  ) => Effect.Effect<WalletRow, WalletRecordNotFound | WalletRepositoryError>;
  decreaseBalance: (input: DecreaseBalanceInput) => Effect.Effect<
    WalletRow,
    WalletRecordNotFound | WalletBalanceConstraint | WalletRepositoryError
  >;
  decreaseBalanceInTx: (
    tx: PrismaTypes.TransactionClient,
    input: DecreaseBalanceInput,
  ) => Effect.Effect<
    WalletRow,
    WalletRecordNotFound | WalletBalanceConstraint | WalletRepositoryError
  >;
  reserveBalanceInTx: (
    tx: PrismaTypes.TransactionClient,
    input: { readonly walletId: string; readonly amount: bigint },
  ) => Effect.Effect<boolean, WalletRepositoryError>;
  releaseReservedBalanceInTx: (
    tx: PrismaTypes.TransactionClient,
    input: { readonly walletId: string; readonly amount: bigint },
  ) => Effect.Effect<boolean, WalletRepositoryError>;
  listTransactions: (
    walletId: string,
    pageReq: PageRequest<"createdAt">,
  ) => Effect.Effect<PageResult<WalletTransactionRow>, WalletRepositoryError>;
};

export class WalletRepository extends Context.Tag("WalletRepository")<
  WalletRepository,
  WalletRepo
>() {}

export function makeWalletRepository(client: PrismaClient): WalletRepo {
  const findWalletByUserId = async (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    userId: string,
  ) =>
    tx.wallet.findUnique({
      where: { userId },
      select: selectWalletRow,
    });

  const createTransaction = async (
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
  ) =>
    tx.walletTransaction.create({
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

  return {
    findByUserId: userId =>
      Effect.tryPromise({
        try: async () => {
          const row = await findWalletByUserId(client, userId);
          return Option.fromNullable(row).pipe(Option.map(toWalletRow));
        },
        catch: err =>
          new WalletRepositoryError({
            operation: "findByUserId",
            cause: err,
          }),
      }),

    findByUserIdInTx: (tx, userId) =>
      Effect.tryPromise({
        try: async () => {
          const row = await findWalletByUserId(tx, userId);
          return Option.fromNullable(row).pipe(Option.map(toWalletRow));
        },
        catch: err =>
          new WalletRepositoryError({
            operation: "findByUserIdInTx",
            cause: err,
          }),
      }),

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
      }),

    createForUserInTx: (tx, userId) =>
      Effect.tryPromise({
        try: async () => {
          const row = await tx.wallet.create({
            data: {
              userId,
            },
            select: selectWalletRow,
          });
          return toWalletRow(row);
        },
        catch: (err) => {
          if (isPrismaUniqueViolation(err)) {
            return new WalletUniqueViolation({ operation: "createForUserInTx", constraint: "wallet.userId", userId });
          }
          return new WalletRepositoryError({ operation: "createForUserInTx", cause: err });
        },
      }),

    increaseBalance: input =>
      Effect.tryPromise({
        try: async () => {
          const amount = input.amount;
          const fee = input.fee ?? 0n;
          const net = amount - fee;
          const txType: WalletTransactionType = input.type ?? "DEPOSIT";
          const txStatus: WalletTransactionStatus = "SUCCESS";

          const updated = await client.$transaction(async (tx) => {
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
      }),

    increaseBalanceInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          const amount = input.amount;
          const fee = input.fee ?? 0n;
          const net = amount - fee;
          const txType: WalletTransactionType = input.type ?? "DEPOSIT";
          const txStatus: WalletTransactionStatus = "SUCCESS";

          const wallet = await findWalletByUserId(tx, input.userId);
          if (!wallet) {
            throw new WalletRecordNotFound({ operation: "increaseBalanceInTx.findWallet", userId: input.userId });
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

          return toWalletRow(bumped);
        },
        catch: (err) => {
          if (err instanceof WalletRecordNotFound)
            return err;
          return new WalletRepositoryError({ operation: "increaseBalanceInTx", cause: err });
        },
      }),

    decreaseBalance: input =>
      Effect.tryPromise({
        try: async () => {
          const amount = input.amount;
          const txType: WalletTransactionType = input.type ?? "DEBIT";
          const txStatus: WalletTransactionStatus = "SUCCESS";

          const updated = await client.$transaction(async (tx) => {
            const wallet = await findWalletByUserId(tx, input.userId);
            if (!wallet) {
              throw new WalletRecordNotFound({ operation: "decreaseBalance.findWallet", userId: input.userId });
            }

            const changed = await tx.wallet.updateMany({
              where: {
                id: wallet.id,
                balance: { gte: amount },
              },
              data: {
                balance: { decrement: amount },
              },
            });

            if (changed.count === 0) {
              throw new WalletBalanceConstraint({
                operation: "decreaseBalance.updateBalance",
                walletId: wallet.id,
                userId: input.userId,
                balance: wallet.balance,
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
      }),

    decreaseBalanceInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          const amount = input.amount;
          const txType: WalletTransactionType = input.type ?? "DEBIT";
          const txStatus: WalletTransactionStatus = "SUCCESS";

          const wallet = await findWalletByUserId(tx, input.userId);
          if (!wallet) {
            throw new WalletRecordNotFound({ operation: "decreaseBalanceInTx.findWallet", userId: input.userId });
          }

          const changed = await tx.wallet.updateMany({
            where: {
              id: wallet.id,
              balance: { gte: amount },
            },
            data: {
              balance: { decrement: amount },
            },
          });

          if (changed.count === 0) {
            throw new WalletBalanceConstraint({
              operation: "decreaseBalanceInTx.updateBalance",
              walletId: wallet.id,
              userId: input.userId,
              balance: wallet.balance,
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

          return toWalletRow(refreshed!);
        },
        catch: (err) => {
          if (err instanceof WalletRecordNotFound || err instanceof WalletBalanceConstraint) {
            return err;
          }
          return new WalletRepositoryError({ operation: "decreaseBalanceInTx", cause: err });
        },
      }),

    reserveBalanceInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.$executeRaw`UPDATE "wallets"
            SET "reserved_balance" = "reserved_balance" + ${input.amount}
            WHERE "id" = ${input.walletId}
              AND "balance" - "reserved_balance" >= ${input.amount}`;
          return updated > 0;
        },
        catch: err =>
          new WalletRepositoryError({
            operation: "reserveBalanceInTx",
            cause: err,
          }),
      }),

    releaseReservedBalanceInTx: (tx, input) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.wallet.updateMany({
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
            operation: "releaseReservedBalanceInTx",
            cause: err,
          }),
      }),

    listTransactions: (walletId, pageReq) => {
      const { page, pageSize, skip, take } = normalizedPage(pageReq);

      return Effect.gen(function* () {
        const [total, rows] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.walletTransaction.count({ where: { walletId } }),
            catch: err =>
              new WalletRepositoryError({
                operation: "listTransactions.count",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.walletTransaction.findMany({
                where: { walletId },
                orderBy: { createdAt: "desc" },
                skip,
                take,
                select: selectWalletTransactionRow,
              }),
            catch: err =>
              new WalletRepositoryError({
                operation: "listTransactions.findMany",
                cause: err,
              }),
          }),
        ]);

        return makePageResult(rows.map(toWalletTransactionRow), total, page, pageSize);
      });
    },
  };
}

export const WalletRepositoryLive = Layer.effect(
  WalletRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeWalletRepository(client);
  }),
);
