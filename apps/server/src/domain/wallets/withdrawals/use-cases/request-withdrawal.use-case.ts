import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect, Match } from "effect";
import { uuidv7 } from "uuidv7";

import type { UserRepositoryError } from "@/domain/users/domain-errors";
import type {
  WalletHoldRepositoryError,
  WalletRepositoryError,
} from "@/domain/wallets/domain-errors";

import { env } from "@/config/env";
import { UserServiceTag } from "@/domain/users/services/user.service";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
import { WalletRepository } from "@/domain/wallets/repository/wallet.repository";
import { WalletHoldServiceTag } from "@/domain/wallets/services/wallet-hold.service";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type {
  DuplicateWithdrawalRequest,
  WithdrawalRepositoryError,
} from "../domain-errors";
import type { WalletWithdrawalRow } from "../models";

import {
  InvalidWithdrawalRequest,
  StripeConnectNotLinked,
  StripePayoutsNotEnabled,
  WithdrawalUserNotFound,
} from "../domain-errors";
import { WithdrawalServiceTag } from "../services/withdrawal.service";

export type RequestWithdrawalInput = {
  readonly userId: string;
  readonly amount: bigint;
  readonly currency?: string;
  readonly idempotencyKey?: string;
  readonly now?: Date;
};

export function requestWithdrawalUseCase(
  input: RequestWithdrawalInput,
): Effect.Effect<
  WalletWithdrawalRow,
  | InvalidWithdrawalRequest
  | StripeConnectNotLinked
  | StripePayoutsNotEnabled
  | DuplicateWithdrawalRequest
  | InsufficientWalletBalance
  | WalletNotFound
  | WalletHoldRepositoryError
  | WalletRepositoryError
  | UserRepositoryError
  | WithdrawalRepositoryError
  | WithdrawalUserNotFound,
  Prisma | WithdrawalServiceTag | WalletRepository | WalletHoldServiceTag | UserServiceTag
> {
  return Effect.gen(function* () {
    const minAmount = BigInt(env.MIN_WITHDRAWAL_AMOUNT);
    if (input.amount <= 0n || input.amount < minAmount) {
      return yield* Effect.fail(new InvalidWithdrawalRequest({
        message: `amount must be at least ${minAmount.toString()}`,
      }));
    }

    const userService = yield* UserServiceTag;
    const withdrawalService = yield* WithdrawalServiceTag;
    const walletRepo = yield* WalletRepository;
    const walletHoldService = yield* WalletHoldServiceTag;
    const { client } = yield* Prisma;

    const userOpt = yield* userService.getById(input.userId);
    const user = yield* Match.value(userOpt).pipe(
      Match.tag("Some", ({ value }) => Effect.succeed(value)),
      Match.tag("None", () => Effect.fail(new WithdrawalUserNotFound({ userId: input.userId }))),
      Match.exhaustive,
    );

    const accountId = user.stripeConnectedAccountId;
    if (!accountId) {
      return yield* Effect.fail(new StripeConnectNotLinked({ userId: user.id }));
    }

    if (user.stripePayoutsEnabled !== true) {
      return yield* Effect.fail(new StripePayoutsNotEnabled({
        userId: user.id,
        accountId,
      }));
    }

    const currency = (input.currency ?? "vnd").toLowerCase();
    const now = input.now ?? new Date();
    const idempotencyKey = input.idempotencyKey ?? `withdraw:${uuidv7()}`;

    const withdrawal = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const walletOpt = yield* walletRepo.findByUserIdInTx(tx, user.id);
        const wallet = yield* Match.value(walletOpt).pipe(
          Match.tag("Some", ({ value }) => Effect.succeed(value)),
          Match.tag("None", () => Effect.fail(new WalletNotFound({ userId: user.id }))),
          Match.exhaustive,
        );

        const withdrawal = yield* withdrawalService.createPendingInTx(tx, {
          userId: user.id,
          walletId: wallet.id,
          amount: input.amount,
          currency,
          idempotencyKey,
        });

        const reservedRows = yield* walletRepo.reserveBalanceInTx(tx, {
          walletId: wallet.id,
          amount: input.amount,
        });

        const available = wallet.balance - wallet.reservedBalance;
        if (!reservedRows) {
          return yield* Effect.fail(new InsufficientWalletBalance({
            walletId: wallet.id,
            userId: user.id,
            balance: available,
            attemptedDebit: input.amount,
          }));
        }

        yield* walletHoldService.createInTx(tx, {
          walletId: wallet.id,
          withdrawalId: withdrawal.id,
          amount: input.amount,
          reason: "WITHDRAWAL",
        });

        yield* enqueueOutboxJobInTx(tx, {
          type: JobTypes.WalletWithdrawalExecute,
          payload: {
            version: 1,
            withdrawalId: withdrawal.id,
          },
          runAt: now,
          dedupeKey: `withdrawal:execute:${withdrawal.id}`,
        });

        return withdrawal;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    return withdrawal;
  });
}
