import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { WalletTransactionStatus } from "generated/prisma/client";

import type { WalletRow, WalletTransactionRow, WalletTransactionUserRow } from "../../models";

import { WalletNotFound } from "../../domain-errors";
import { WalletQueryRepository } from "../../repository/wallet-query.repository";

/**
 * Service đọc wallet cho HTTP, AI tool và flow cần wallet snapshot.
 *
 * Service này chỉ map Option ở repository sang lỗi domain ở boundary nghiệp vụ.
 */
export type WalletQueryService = {
  /**
   * Đọc wallet optional theo user.
   *
   * @param userId ID user sở hữu wallet.
   */
  getOptionalByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<WalletRow>>;

  /**
   * Đọc wallet bắt buộc theo user.
   *
   * @param userId ID user sở hữu wallet.
   */
  getByUserId: (
    userId: string,
  ) => Effect.Effect<WalletRow, WalletNotFound>;

  /**
   * List transaction của wallet hiện tại của user.
   *
   * @param args Dữ liệu truy vấn transaction.
   * @param args.userId ID user sở hữu wallet.
   * @param args.pageReq Thông tin phân trang.
   * @param args.status Trạng thái transaction cần lọc.
   */
  listTransactionsForUser: (
    args: { userId: string; pageReq: PageRequest<"createdAt">; status?: WalletTransactionStatus },
  ) => Effect.Effect<PageResult<WalletTransactionRow>, WalletNotFound>;

  /**
   * Đọc chi tiết một transaction theo scope wallet của user.
   *
   * @param args Dữ liệu truy vấn transaction.
   * @param args.userId ID user sở hữu wallet.
   * @param args.transactionId ID transaction cần đọc.
   */
  getTransactionByIdForUser: (
    args: { userId: string; transactionId: string },
  ) => Effect.Effect<Option.Option<WalletTransactionRow>, WalletNotFound>;

  /**
   * List transaction cho admin kèm snapshot user owner.
   *
   * @param args Dữ liệu truy vấn admin.
   * @param args.userId ID user cần xem wallet.
   * @param args.pageReq Thông tin phân trang.
   * @param args.status Trạng thái transaction cần lọc.
   */
  adminListTransactionsForUser: (
    args: { userId: string; pageReq: PageRequest<"createdAt">; status?: WalletTransactionStatus },
  ) => Effect.Effect<{
    user: WalletTransactionUserRow;
    transactions: PageResult<WalletTransactionRow>;
  }, WalletNotFound>;
};

export class WalletQueryServiceTag extends Context.Tag("WalletQueryService")<
  WalletQueryServiceTag,
  WalletQueryService
>() {}

/**
 * Layer live cho wallet query service.
 *
 * @remarks Cần `WalletQueryRepository` trong environment.
 */
export const WalletQueryServiceLive = Layer.effect(
  WalletQueryServiceTag,
  Effect.gen(function* () {
    const repo = yield* WalletQueryRepository;

    const getOptionalByUserId: WalletQueryService["getOptionalByUserId"] = userId =>
      repo.findByUserId(userId);

    const getByUserId: WalletQueryService["getByUserId"] = userId =>
      repo.findByUserId(userId).pipe(
        Effect.flatMap(option =>
          Option.match(option, {
            onNone: () => Effect.fail(new WalletNotFound({ userId })),
            onSome: value => Effect.succeed(value),
          }),
        ),
      );

    const listTransactionsForUser: WalletQueryService["listTransactionsForUser"] = ({
      userId,
      pageReq,
      status,
    }) =>
      Effect.gen(function* () {
        const wallet = yield* getByUserId(userId);
        return yield* repo.listTransactions(wallet.id, pageReq, { status });
      });

    const getTransactionByIdForUser: WalletQueryService["getTransactionByIdForUser"] = ({
      userId,
      transactionId,
    }) =>
      Effect.gen(function* () {
        const wallet = yield* getByUserId(userId);
        return yield* repo.findTransactionById(wallet.id, transactionId);
      });

    const adminListTransactionsForUser: WalletQueryService["adminListTransactionsForUser"] = ({
      userId,
      pageReq,
      status,
    }) =>
      Effect.gen(function* () {
        const owner = yield* repo.findTransactionListOwnerByUserId(userId).pipe(
          Effect.flatMap(option =>
            Option.match(option, {
              onNone: () => Effect.fail(new WalletNotFound({ userId })),
              onSome: value => Effect.succeed(value),
            }),
          ),
        );

        const transactions = yield* repo.listTransactions(owner.walletId, pageReq, { status });

        return {
          user: owner.user,
          transactions,
        };
      });

    return {
      adminListTransactionsForUser,
      getByUserId,
      getOptionalByUserId,
      getTransactionByIdForUser,
      listTransactionsForUser,
    } satisfies WalletQueryService;
  }),
);
