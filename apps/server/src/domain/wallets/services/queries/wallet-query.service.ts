import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { WalletTransactionStatus } from "generated/prisma/client";

import type { WalletRow, WalletTransactionRow, WalletTransactionUserRow } from "../../models";

import { WalletNotFound } from "../../domain-errors";
import { WalletQueryRepository } from "../../repository/wallet-query.repository";

export type WalletQueryService = {
  getOptionalByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<WalletRow>>;

  getByUserId: (
    userId: string,
  ) => Effect.Effect<WalletRow, WalletNotFound>;

  listTransactionsForUser: (
    args: { userId: string; pageReq: PageRequest<"createdAt">; status?: WalletTransactionStatus },
  ) => Effect.Effect<PageResult<WalletTransactionRow>, WalletNotFound>;

  getTransactionByIdForUser: (
    args: { userId: string; transactionId: string },
  ) => Effect.Effect<Option.Option<WalletTransactionRow>, WalletNotFound>;

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
