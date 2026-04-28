import { Context, Effect, Layer } from "effect";

import type { DecreaseBalanceInput, IncreaseBalanceInput, WalletRow } from "../../models";

import {
  InsufficientWalletBalance,
  WalletAlreadyExists,
  WalletNotFound,
} from "../../domain-errors";
import { WalletCommandRepository } from "../../repository/wallet-command.repository";
import { WalletQueryServiceTag } from "../queries/wallet-query.service";

export type WalletCommandService = {
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
};

export class WalletCommandServiceTag extends Context.Tag("WalletCommandService")<
  WalletCommandServiceTag,
  WalletCommandService
>() {}

export const WalletCommandServiceLive = Layer.effect(
  WalletCommandServiceTag,
  Effect.gen(function* () {
    const repo = yield* WalletCommandRepository;
    const queryService = yield* WalletQueryServiceTag;

    const createForUser: WalletCommandService["createForUser"] = userId =>
      repo.createForUser(userId).pipe(
        Effect.catchTag("WalletUniqueViolation", () =>
          Effect.fail(new WalletAlreadyExists({ userId }))),
      );

    const creditWallet: WalletCommandService["creditWallet"] = input =>
      repo.increaseBalance(input).pipe(
        Effect.catchTag("WalletRecordNotFound", () =>
          Effect.fail(new WalletNotFound({ userId: input.userId }))),
        Effect.catchTag("WalletUniqueViolation", () =>
          queryService.getByUserId(input.userId)),
      );

    const debitWallet: WalletCommandService["debitWallet"] = input =>
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

    return {
      createForUser,
      creditWallet,
      debitWallet,
    } satisfies WalletCommandService;
  }),
);
