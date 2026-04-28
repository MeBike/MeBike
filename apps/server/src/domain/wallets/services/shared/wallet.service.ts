import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { WalletTransactionStatus } from "generated/prisma/client";

import type {
  DecreaseBalanceInput,
  IncreaseBalanceInput,
  WalletRow,
  WalletTransactionRow,
  WalletTransactionUserRow,
} from "../../models";

import {
  InsufficientWalletBalance,
  WalletAlreadyExists,
  WalletNotFound,
} from "../../domain-errors";
import { WalletRepository } from "../../repository/wallet.repository";

export type WalletService = {
  getOptionalByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<WalletRow>>;

  getByUserId: (
    userId: string,
  ) => Effect.Effect<WalletRow, WalletNotFound>;

  createForUser: (
    userId: string,
  ) => Effect.Effect<WalletRow, WalletAlreadyExists>;

  creditWallet: (
    input: IncreaseBalanceInput,
  ) => Effect.Effect<WalletRow, WalletNotFound>;

  debitWallet: (
    input: DecreaseBalanceInput,
  ) => Effect.Effect<
    WalletRow,
    WalletNotFound | InsufficientWalletBalance
  >;

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

export class WalletServiceTag extends Context.Tag("WalletService")<
  WalletServiceTag,
  WalletService
>() {}

export const WalletServiceLive = Layer.effect(
  WalletServiceTag,
  Effect.gen(function* () {
    const repo = yield* WalletRepository;

    const getOptionalByUserId: WalletService["getOptionalByUserId"] = userId =>
      repo.findByUserId(userId);

    const getByUserId: WalletService["getByUserId"] = userId =>
      repo.findByUserId(userId).pipe(
        Effect.flatMap(option =>
          Option.match(option, {
            onNone: () => Effect.fail(new WalletNotFound({ userId })),
            onSome: value => Effect.succeed(value),
          }),
        ),
      );

    const createForUser: WalletService["createForUser"] = userId =>
      repo.createForUser(userId).pipe(
        Effect.catchTag("WalletUniqueViolation", () =>
          Effect.fail(new WalletAlreadyExists({ userId }))),
      );

    const creditWallet: WalletService["creditWallet"] = input =>
      repo.increaseBalance(input).pipe(
        Effect.catchTag("WalletRecordNotFound", () =>
          Effect.fail(new WalletNotFound({ userId: input.userId }))),
        Effect.catchTag("WalletUniqueViolation", () =>
          getByUserId(input.userId)),
      );

    const debitWallet: WalletService["debitWallet"] = input =>
      repo.decreaseBalance(input).pipe(
        Effect.catchTag("WalletRecordNotFound", () =>
          Effect.fail(new WalletNotFound({ userId: input.userId }))),
        Effect.catchTag(
          "WalletBalanceConstraint",
          err => Effect.fail(new InsufficientWalletBalance({
            walletId: err.walletId,
            userId: err.userId,
            balance: err.balance,
            attemptedDebit: err.attemptedDebit,
          })),
        ),
      );

    const listTransactionsForUser: WalletService["listTransactionsForUser"] = ({
      userId,
      pageReq,
      status,
    }) =>
      Effect.gen(function* () {
        const wallet = yield* getByUserId(userId);
        return yield* repo.listTransactions(wallet.id, pageReq, { status });
      });

    const getTransactionByIdForUser: WalletService["getTransactionByIdForUser"] = ({
      userId,
      transactionId,
    }) =>
      Effect.gen(function* () {
        const wallet = yield* getByUserId(userId);
        return yield* repo.findTransactionById(wallet.id, transactionId);
      });

    const adminListTransactionsForUser: WalletService["adminListTransactionsForUser"] = ({
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

    const service: WalletService = {
      getOptionalByUserId,
      getByUserId,
      createForUser,
      creditWallet,
      debitWallet,
      listTransactionsForUser,
      getTransactionByIdForUser,
      adminListTransactionsForUser,
    };

    return service;
  }),
);
