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

/**
 * Contract persistence ghi cho wallet balance và reservation balance.
 *
 * Các hàm ở đây tạo wallet transaction cùng transaction DB với thay đổi balance.
 */
export type WalletCommandRepo = {
  /**
   * Tạo wallet mặc định cho một user mới.
   *
   * @param userId ID user cần tạo wallet.
   */
  createForUser: (userId: string) => Effect.Effect<WalletRow, WalletUniqueViolation>;

  /**
   * Cộng tiền vào wallet và ghi transaction ledger tương ứng.
   *
   * @param input Dữ liệu credit wallet.
   * @param input.userId ID user được cộng tiền.
   * @param input.amount Số tiền gross cần ghi vào transaction.
   * @param input.fee Phí trừ khỏi amount trước khi tăng balance.
   * @param input.description Mô tả transaction wallet.
   * @param input.hash Khóa idempotency của ledger entry.
   * @param input.type Loại transaction cần ghi.
   */
  increaseBalance: (
    input: IncreaseBalanceInput,
  ) => Effect.Effect<WalletRow, WalletRecordNotFound | WalletUniqueViolation>;

  /**
   * Trừ tiền khỏi available balance và ghi transaction ledger tương ứng.
   *
   * @param input Dữ liệu debit wallet.
   * @param input.userId ID user bị trừ tiền.
   * @param input.amount Số tiền cần trừ khỏi available balance.
   * @param input.description Mô tả transaction wallet.
   * @param input.hash Khóa idempotency của ledger entry.
   * @param input.type Loại transaction cần ghi.
   */
  decreaseBalance: (input: DecreaseBalanceInput) => Effect.Effect<
    WalletRow,
    WalletRecordNotFound | WalletBalanceConstraint
  >;

  /**
   * Giữ một phần available balance mà chưa trừ khỏi balance thật.
   *
   * @param input Dữ liệu reserve balance.
   * @param input.walletId ID wallet cần giữ tiền.
   * @param input.amount Số tiền cần giữ.
   */
  reserveBalance: (
    input: { readonly walletId: string; readonly amount: bigint },
  ) => Effect.Effect<boolean>;

  /**
   * Giải phóng phần balance đã reserve trước đó.
   *
   * @param input Dữ liệu release reserved balance.
   * @param input.walletId ID wallet cần release tiền giữ.
   * @param input.amount Số tiền cần release.
   */
  releaseReservedBalance: (
    input: { readonly walletId: string; readonly amount: bigint },
  ) => Effect.Effect<boolean>;
};

export class WalletCommandRepository extends Context.Tag("WalletCommandRepository")<
  WalletCommandRepository,
  WalletCommandRepo
>() {}

/**
 * Đọc wallet trong cùng transaction trước khi mutate balance.
 *
 * @param tx Prisma client hoặc transaction client đang dùng.
 * @param userId ID user sở hữu wallet.
 */
async function findWalletByUserId(
  tx: PrismaClient | PrismaTypes.TransactionClient,
  userId: string,
) {
  return tx.wallet.findUnique({
    where: { userId },
    select: selectWalletRow,
  });
}

/**
 * Tạo ledger entry cho một thay đổi balance.
 *
 * @param tx Prisma client hoặc transaction client đang dùng.
 * @param args Dữ liệu transaction wallet cần ghi.
 * @param args.walletId ID wallet được ghi transaction.
 * @param args.amount Số tiền gross của transaction.
 * @param args.fee Phí của transaction.
 * @param args.description Mô tả transaction wallet.
 * @param args.hash Khóa idempotency của ledger entry.
 * @param args.type Loại transaction wallet.
 * @param args.status Trạng thái transaction wallet.
 */
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

/**
 * Tạo wallet command repository bám theo Prisma client hoặc transaction client hiện tại.
 *
 * Khi nhận root Prisma client, các mutation balance sẽ tự mở transaction.
 * Khi nhận transaction client, mutation sẽ dùng transaction bên ngoài.
 *
 * @param client Prisma client hoặc transaction client đang dùng.
 */
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
