import type { Option } from "effect";

import { Context, Effect, Layer } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  WalletRepositoryError,
} from "../domain-errors";
import type { DecreaseBalanceInput, IncreaseBalanceInput, WalletRow, WalletTransactionRow } from "../models";

import {
  InsufficientWalletBalance,
  WalletAlreadyExists,
  WalletNotFound,
} from "../domain-errors";
import { WalletRepository } from "../repository/wallet.repository";

export type WalletService = {
  getOptionalByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<WalletRow>, WalletRepositoryError>;

  getByUserId: (
    userId: string,
  ) => Effect.Effect<WalletRow, WalletNotFound | WalletRepositoryError>;

  createForUser: (
    userId: string,
  ) => Effect.Effect<WalletRow, WalletAlreadyExists | WalletRepositoryError>;

  creditWallet: (
    input: IncreaseBalanceInput,
  ) => Effect.Effect<WalletRow, WalletNotFound | WalletRepositoryError>;

  creditWalletInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: IncreaseBalanceInput,
  ) => Effect.Effect<WalletRow, WalletNotFound | WalletRepositoryError>;

  debitWallet: (
    input: DecreaseBalanceInput,
  ) => Effect.Effect<
    WalletRow,
    WalletNotFound | InsufficientWalletBalance | WalletRepositoryError
  >;

  debitWalletInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: DecreaseBalanceInput,
  ) => Effect.Effect<
    WalletRow,
    WalletNotFound | InsufficientWalletBalance | WalletRepositoryError
  >;

  listTransactionsForUser: (
    args: { userId: string; pageReq: PageRequest<"createdAt"> },
  ) => Effect.Effect<PageResult<WalletTransactionRow>, WalletNotFound | WalletRepositoryError>;
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
        Effect.flatMap(maybeWallet =>
          maybeWallet._tag === "Some"
            ? Effect.succeed(maybeWallet.value)
            : Effect.fail(new WalletNotFound({ userId })),
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
      );

    const creditWalletInTx: WalletService["creditWalletInTx"] = (tx, input) =>
      repo.increaseBalanceInTx(tx, input).pipe(
        Effect.catchTag("WalletRecordNotFound", () =>
          Effect.fail(new WalletNotFound({ userId: input.userId }))),
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

    const debitWalletInTx: WalletService["debitWalletInTx"] = (tx, input) =>
      repo.decreaseBalanceInTx(tx, input).pipe(
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

    const listTransactionsForUser: WalletService["listTransactionsForUser"] = ({ userId, pageReq }) =>
      Effect.gen(function* () {
        const wallet = yield* getByUserId(userId);
        return yield* repo.listTransactions(wallet.id, pageReq);
      });

    const service: WalletService = {
      getOptionalByUserId,
      getByUserId,
      createForUser,
      creditWallet,
      creditWalletInTx,
      debitWallet,
      debitWalletInTx,
      listTransactionsForUser,
    };

    return service;
  }),
);
