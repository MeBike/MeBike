import type Stripe from "stripe";

import { Effect, Match } from "effect";

import type { UserRepositoryError } from "@/domain/users/domain-errors";
import type {
  InsufficientWalletBalance,
  WalletHoldRepositoryError,
  WalletNotFound,
  WalletRepositoryError,
} from "@/domain/wallets/domain-errors";

import { env } from "@/config/env";
import { UserServiceTag } from "@/domain/users/services/user.service";
import { WalletHoldServiceTag } from "@/domain/wallets/services/wallet-hold.service";
import { WalletServiceTag } from "@/domain/wallets/services/wallet.service";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { WithdrawalProviderError, WithdrawalRepositoryError } from "../domain-errors";

import { StripeWithdrawalServiceTag } from "../services/stripe-withdrawal.service";
import { WithdrawalServiceTag } from "../services/withdrawal.service";

export type WithdrawalSweepSummary = {
  readonly scanned: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly pending: number;
};

const SWEEP_LIMIT = 100;

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
  | WithdrawalServiceTag
  | WalletHoldServiceTag
  | WalletServiceTag
  | UserServiceTag
  | StripeWithdrawalServiceTag
> {
  return Effect.gen(function* () {
    const withdrawalService = yield* WithdrawalServiceTag;
    const walletHoldService = yield* WalletHoldServiceTag;
    const walletService = yield* WalletServiceTag;
    const userService = yield* UserServiceTag;
    const stripeService = yield* StripeWithdrawalServiceTag;
    const { client } = yield* Prisma;

    const slaMs = env.WITHDRAWAL_SLA_MINUTES * 60 * 1000;
    const staleBefore = new Date(now.getTime() - slaMs);

    const withdrawals = yield* withdrawalService.findProcessingBefore(staleBefore, SWEEP_LIMIT);

    let succeeded = 0;
    let failed = 0;
    let pending = 0;

    for (const withdrawal of withdrawals) {
      if (!withdrawal.stripePayoutId) {
        const updated = yield* markFailedAndReleaseHold(
          client,
          withdrawalService,
          walletHoldService,
          walletService,
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
          withdrawalService,
          walletHoldService,
          walletService,
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
          withdrawalService,
          walletHoldService,
          walletService,
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
          withdrawalService,
          walletHoldService,
          walletService,
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
  withdrawalService: import("../services/withdrawal.service").WithdrawalService,
  walletHoldService: import("@/domain/wallets/services/wallet-hold.service").WalletHoldService,
  walletService: import("@/domain/wallets/services/wallet.service").WalletService,
  withdrawal: import("../models").WalletWithdrawalRow,
  payoutId: string,
  now: Date,
): Effect.Effect<boolean, WithdrawalRepositoryError | WalletHoldRepositoryError | WalletNotFound | WalletRepositoryError | InsufficientWalletBalance> {
  return runPrismaTransaction(client, tx =>
    Effect.gen(function* () {
      const marked = yield* withdrawalService.markSucceededInTx(tx, {
        withdrawalId: withdrawal.id,
        stripePayoutId: payoutId,
      });

      if (!marked) {
        return false;
      }

      const settled = yield* walletHoldService.settleByWithdrawalIdInTx(
        tx,
        withdrawal.id,
        now,
      );
      if (!settled) {
        // Legacy rows may not have a hold; treat as already settled.
        return true;
      }

      yield* walletService.releaseReservedBalanceInTx(tx, {
        walletId: withdrawal.walletId,
        amount: withdrawal.amount,
      });

      yield* walletService.debitWalletInTx(tx, {
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
  withdrawalService: import("../services/withdrawal.service").WithdrawalService,
  walletHoldService: import("@/domain/wallets/services/wallet-hold.service").WalletHoldService,
  walletService: import("@/domain/wallets/services/wallet.service").WalletService,
  withdrawal: import("../models").WalletWithdrawalRow,
  reason: string,
  now: Date,
): Effect.Effect<boolean, WithdrawalRepositoryError | WalletHoldRepositoryError | WalletRepositoryError> {
  return runPrismaTransaction(client, tx =>
    Effect.gen(function* () {
      const marked = yield* withdrawalService.markFailedInTx(tx, {
        withdrawalId: withdrawal.id,
        failureReason: reason,
      });

      if (!marked) {
        return false;
      }

      yield* walletService.releaseReservedBalanceInTx(tx, {
        walletId: withdrawal.walletId,
        amount: withdrawal.amount,
      });

      const released = yield* walletHoldService.releaseByWithdrawalIdInTx(
        tx,
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
