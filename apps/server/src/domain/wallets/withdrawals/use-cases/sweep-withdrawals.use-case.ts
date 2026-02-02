import type Stripe from "stripe";

import { Effect, Match } from "effect";

import type { UserRepositoryError } from "@/domain/users/domain-errors";
import type {
  WalletBalanceConstraint,
  WalletHoldRepositoryError,
  WalletRepositoryError,
} from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";

import { env } from "@/config/env";
import { UserServiceTag } from "@/domain/users/services/user.service";
import {
  InsufficientWalletBalance,
  WalletNotFound,
} from "@/domain/wallets/domain-errors";
import { makeWalletHoldRepository } from "@/domain/wallets/repository/wallet-hold.repository";
import { makeWalletRepository } from "@/domain/wallets/repository/wallet.repository";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { WithdrawalProviderError, WithdrawalRepositoryError } from "../domain-errors";

import { makeWithdrawalRepository, WithdrawalRepository } from "../repository/withdrawal.repository";
import { StripeWithdrawalServiceTag } from "../services/stripe-withdrawal.service";

export type WithdrawalSweepSummary = {
  readonly scanned: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly pending: number;
};

const SWEEP_LIMIT = 100;

function debitWallet(
  repo: ReturnType<typeof makeWalletRepository>,
  input: DecreaseBalanceInput,
) {
  return repo.decreaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new WalletNotFound({ userId: input.userId }))),
    Effect.catchTag("WalletBalanceConstraint", (err: WalletBalanceConstraint) =>
      Effect.fail(new InsufficientWalletBalance({
        walletId: err.walletId,
        userId: err.userId,
        balance: err.balance,
        attemptedDebit: err.attemptedDebit,
      }))),
  );
}

function isPayoutTerminalFailure(status: Stripe.Payout["status"]): boolean {
  return status === "failed" || status === "canceled";
}

function isPayoutSucceeded(status: Stripe.Payout["status"]): boolean {
  return status === "paid";
}

function isPayoutPending(status: Stripe.Payout["status"]): boolean {
  return status === "pending" || status === "in_transit";
}

export function sweepWithdrawalsUseCase(
  now: Date = new Date(),
): Effect.Effect<
  WithdrawalSweepSummary,
  | WithdrawalRepositoryError
  | WalletHoldRepositoryError
  | WalletNotFound
  | WalletRepositoryError
  | InsufficientWalletBalance
  | WithdrawalProviderError
  | UserRepositoryError,
  Prisma
  | WithdrawalRepository
  | UserServiceTag
  | StripeWithdrawalServiceTag
> {
  return Effect.gen(function* () {
    const withdrawalRepo = yield* WithdrawalRepository;
    const userService = yield* UserServiceTag;
    const stripeService = yield* StripeWithdrawalServiceTag;
    const { client } = yield* Prisma;

    const slaMs = env.WITHDRAWAL_SLA_MINUTES * 60 * 1000;
    const staleBefore = new Date(now.getTime() - slaMs);

    const withdrawals = yield* withdrawalRepo.findProcessingBefore(staleBefore, SWEEP_LIMIT);

    let succeeded = 0;
    let failed = 0;
    let pending = 0;

    for (const withdrawal of withdrawals) {
      if (!withdrawal.stripePayoutId) {
        const updated = yield* markFailedAndReleaseHold(
          client,
          withdrawal,
          "processing_timeout",
          now,
        );
        if (updated) {
          failed += 1;
        }
        continue;
      }

      const userOpt = yield* userService.getById(withdrawal.userId);
      const user = yield* Match.value(userOpt).pipe(
        Match.tag("Some", ({ value }) => Effect.succeed(value)),
        Match.tag("None", () => Effect.succeed(null)),
        Match.exhaustive,
      );

      if (!user || !user.stripeConnectedAccountId) {
        const updated = yield* markFailedAndReleaseHold(
          client,
          withdrawal,
          user ? "stripe_account_missing" : "user_missing",
          now,
        );
        if (updated) {
          failed += 1;
        }
        continue;
      }

      const payout = yield* stripeService.retrievePayout({
        payoutId: withdrawal.stripePayoutId,
        accountId: user.stripeConnectedAccountId,
      });

      if (isPayoutSucceeded(payout.status)) {
        const updated = yield* markSucceededAndSettle(
          client,
          withdrawal,
          payout.id,
          now,
        );
        if (updated) {
          succeeded += 1;
        }
        continue;
      }

      if (isPayoutTerminalFailure(payout.status)) {
        const updated = yield* markFailedAndReleaseHold(
          client,
          withdrawal,
          payout.failure_message ?? payout.status,
          now,
        );
        if (updated) {
          failed += 1;
        }
        continue;
      }

      if (isPayoutPending(payout.status)) {
        pending += 1;
        continue;
      }

      pending += 1;
    }

    return {
      scanned: withdrawals.length,
      succeeded,
      failed,
      pending,
    } satisfies WithdrawalSweepSummary;
  });
}

function markSucceededAndSettle(
  client: import("generated/prisma/client").PrismaClient,
  withdrawal: import("../models").WalletWithdrawalRow,
  payoutId: string,
  now: Date,
): Effect.Effect<boolean, WithdrawalRepositoryError | WalletHoldRepositoryError | WalletNotFound | WalletRepositoryError | InsufficientWalletBalance> {
  return runPrismaTransaction(client, tx =>
    Effect.gen(function* () {
      const txWithdrawalRepo = makeWithdrawalRepository(tx);
      const txWalletHoldRepo = makeWalletHoldRepository(tx);
      const txWalletRepo = makeWalletRepository(tx);

      const marked = yield* txWithdrawalRepo.markSucceeded({
        withdrawalId: withdrawal.id,
        stripePayoutId: payoutId,
      });

      if (!marked) {
        return false;
      }

      const settled = yield* txWalletHoldRepo.settleByWithdrawalId(
        withdrawal.id,
        now,
      );
      if (!settled) {
        // Legacy rows may not have a hold; treat as already settled.
        return true;
      }

      yield* txWalletRepo.releaseReservedBalance({
        walletId: withdrawal.walletId,
        amount: withdrawal.amount,
      });

      yield* debitWallet(txWalletRepo, {
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        description: "Withdrawal settled",
        hash: withdrawal.idempotencyKey,
        type: "DEBIT",
      });

      return true;
    })).pipe(
    Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
  );
}

function markFailedAndReleaseHold(
  client: import("generated/prisma/client").PrismaClient,
  withdrawal: import("../models").WalletWithdrawalRow,
  reason: string,
  now: Date,
): Effect.Effect<boolean, WithdrawalRepositoryError | WalletHoldRepositoryError | WalletRepositoryError> {
  return runPrismaTransaction(client, tx =>
    Effect.gen(function* () {
      const txWithdrawalRepo = makeWithdrawalRepository(tx);
      const txWalletHoldRepo = makeWalletHoldRepository(tx);
      const txWalletRepo = makeWalletRepository(tx);

      const marked = yield* txWithdrawalRepo.markFailed({
        withdrawalId: withdrawal.id,
        failureReason: reason,
      });

      if (!marked) {
        return false;
      }

      yield* txWalletRepo.releaseReservedBalance({
        walletId: withdrawal.walletId,
        amount: withdrawal.amount,
      });

      const released = yield* txWalletHoldRepo.releaseByWithdrawalId(
        withdrawal.id,
        now,
      );
      if (!released) {
        // Legacy rows may not have a hold; treat as already released.
        return true;
      }

      return true;
    })).pipe(
    Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
  );
}
