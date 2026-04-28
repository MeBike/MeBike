import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { PrismaClient, Prisma as PrismaTypes, WalletTransactionStatus } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type { WalletRow, WalletTransactionListOwnerRow, WalletTransactionRow } from "../models";

import { WalletRepositoryError } from "../domain-errors";
import {
  selectWalletRow,
  selectWalletTransactionListOwnerRow,
  selectWalletTransactionRow,
  toWalletRow,
  toWalletTransactionListOwnerRow,
  toWalletTransactionRow,
} from "./wallet.mappers";

/**
 * Contract persistence chỉ đọc cho wallet và wallet transaction.
 *
 * Tách riêng khỏi command repo để các flow chỉ cần đọc ví không kéo theo quyền ghi balance.
 */
export type WalletQueryRepo = {
  /**
   * Đọc wallet theo owner user.
   *
   * @param userId ID user sở hữu wallet.
   */
  findByUserId: (userId: string) => Effect.Effect<Option.Option<WalletRow>>;

  /**
   * Đọc context owner dùng cho màn admin list transaction của một user.
   *
   * @param userId ID user cần xem wallet transaction.
   */
  findTransactionListOwnerByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<WalletTransactionListOwnerRow>>;

  /**
   * List transaction của một wallet theo phân trang offset hiện tại.
   *
   * @param walletId ID wallet cần đọc transaction.
   * @param pageReq Thông tin phân trang và sort.
   * @param filter Bộ lọc transaction tùy chọn.
   * @param filter.status Trạng thái transaction cần lọc.
   */
  listTransactions: (
    walletId: string,
    pageReq: PageRequest<"createdAt">,
    filter?: { readonly status?: WalletTransactionStatus },
  ) => Effect.Effect<PageResult<WalletTransactionRow>>;

  /**
   * Đọc một transaction theo id, có scope theo wallet để tránh lộ dữ liệu chéo user.
   *
   * @param walletId ID wallet dùng làm ownership scope.
   * @param transactionId ID transaction cần đọc.
   */
  findTransactionById: (
    walletId: string,
    transactionId: string,
  ) => Effect.Effect<Option.Option<WalletTransactionRow>>;
};

export class WalletQueryRepository extends Context.Tag("WalletQueryRepository")<
  WalletQueryRepository,
  WalletQueryRepo
>() {}

/**
 * Tạo wallet query repository bám theo Prisma client hoặc transaction client hiện tại.
 *
 * @param client Prisma client hoặc transaction client đang dùng.
 */
export function makeWalletQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): WalletQueryRepo {
  return {
    findByUserId: userId =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.wallet.findUnique({
            where: { userId },
            select: selectWalletRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWalletRow));
        },
        catch: err =>
          new WalletRepositoryError({
            operation: "findByUserId",
            cause: err,
          }),
      }).pipe(defectOn(WalletRepositoryError)),

    findTransactionListOwnerByUserId: userId =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.wallet.findUnique({
            where: { userId },
            select: selectWalletTransactionListOwnerRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWalletTransactionListOwnerRow));
        },
        catch: err =>
          new WalletRepositoryError({
            operation: "findTransactionListOwnerByUserId",
            cause: err,
          }),
      }).pipe(defectOn(WalletRepositoryError)),

    listTransactions: (walletId, pageReq, filter) => {
      const { page, pageSize, skip, take } = normalizedPage(pageReq);
      const where = {
        walletId,
        ...(filter?.status ? { status: filter.status } : {}),
      };

      return Effect.gen(function* () {
        const [total, rows] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.walletTransaction.count({ where }),
            catch: err =>
              new WalletRepositoryError({
                operation: "listTransactions.count",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.walletTransaction.findMany({
                where,
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
      }).pipe(defectOn(WalletRepositoryError));
    },

    findTransactionById: (walletId, transactionId) =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletTransaction.findFirst({
            where: { id: transactionId, walletId },
            select: selectWalletTransactionRow,
          });

          return Option.fromNullable(row).pipe(Option.map(toWalletTransactionRow));
        },
        catch: err =>
          new WalletRepositoryError({
            operation: "findTransactionById",
            cause: err,
          }),
      }).pipe(defectOn(WalletRepositoryError)),
  };
}

export const WalletQueryRepositoryLive = Layer.effect(
  WalletQueryRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeWalletQueryRepository(client);
  }),
);
