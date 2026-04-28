import type Stripe from "stripe";

import { Effect, Match } from "effect";

import type {
  WalletBalanceConstraint,
} from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";

import { env } from "@/config/env";
import { defectOn } from "@/domain/shared";
import { UserQueryServiceTag } from "@/domain/users/services/user-query.live";
import {
  InsufficientWalletBalance,
  WalletNotFound,
} from "@/domain/wallets/domain-errors";
import { makeWalletCommandRepository } from "@/domain/wallets/repository/wallet-command.repository";
import { makeWalletHoldRepository } from "@/domain/wallets/repository/wallet-hold.repository";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { WithdrawalProviderError } from "../../domain-errors";

import { makeWithdrawalRepository, WithdrawalRepository } from "../../repository/withdrawal.repository";
import { StripeWithdrawalServiceTag } from "../providers/stripe-withdrawal.service";

export type WithdrawalSweepSummary = {
  readonly scanned: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly pending: number;
};

const SWEEP_LIMIT = 100;

/**
 * Trừ wallet khi payout đã thành công và map lỗi wallet sang lỗi domain ổn định.
 *
 * @param repo Wallet command repo đang bám theo transaction hiện tại.
 * @param input Dữ liệu debit wallet.
 * @param input.userId ID user bị trừ tiền.
 * @param input.amount Số tiền withdrawal cần settle.
 * @param input.description Mô tả transaction wallet.
 * @param input.hash Khóa idempotency của ledger entry.
 * @param input.type Loại transaction wallet cần ghi.
 */
function debitWallet(
  repo: ReturnType<typeof makeWalletCommandRepository>,
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

/**
 * Kiểm tra payout đã ở trạng thái fail terminal hay chưa.
 *
 * @param status Trạng thái payout từ Stripe.
 */
function isPayoutTerminalFailure(status: Stripe.Payout["status"]): boolean {
  return status === "failed" || status === "canceled";
}

/**
 * Kiểm tra payout đã paid hay chưa.
 *
 * @param status Trạng thái payout từ Stripe.
 */
function isPayoutSucceeded(status: Stripe.Payout["status"]): boolean {
  return status === "paid";
}

/**
 * Kiểm tra payout còn đang pending/in_transit hay không.
 *
 * @param status Trạng thái payout từ Stripe.
 */
function isPayoutPending(status: Stripe.Payout["status"]): boolean {
  return status === "pending" || status === "in_transit";
}

/**
 * Sweep các withdrawal processing quá SLA và reconcile với Stripe payout.
 *
 * Worker này là recovery path khi webhook payout bị miss. Nó hỏi Stripe theo payout id,
 * rồi settle hoặc fail withdrawal trong DB theo trạng thái provider hiện tại.
 *
 * @param now Mốc hiện tại dùng để tính SLA cutoff.
 */
export function sweepWithdrawalsUseCase(
  now: Date = new Date(),
): Effect.Effect<
  WithdrawalSweepSummary,
  | WalletNotFound
  | InsufficientWalletBalance
  | WithdrawalProviderError,
  Prisma
  | WithdrawalRepository
  | UserQueryServiceTag
  | StripeWithdrawalServiceTag
> {
  return Effect.gen(function* () {
    const withdrawalRepo = yield* WithdrawalRepository;
    const userService = yield* UserQueryServiceTag;
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

/**
 * Mark withdrawal succeeded, settle hold, release reserved balance và ghi debit ledger.
 *
 * @param client Prisma client root dùng để mở transaction.
 * @param withdrawal Withdrawal cần settle.
 * @param payoutId Stripe payout id đã thành công.
 * @param now Mốc thời gian settle.
 */
function markSucceededAndSettle(
  client: import("generated/prisma/client").PrismaClient,
  withdrawal: import("../../models").WalletWithdrawalRow,
  payoutId: string,
  now: Date,
): Effect.Effect<boolean, WalletNotFound | InsufficientWalletBalance> {
  return runPrismaTransaction(client, tx =>
    Effect.gen(function* () {
      const txWithdrawalRepo = makeWithdrawalRepository(tx);
      const txWalletHoldRepo = makeWalletHoldRepository(tx);
      const txWalletRepo = makeWalletCommandRepository(tx);

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
    defectOn(PrismaTransactionError),
  );
}

/**
 * Mark withdrawal failed và release hold/reserved balance.
 *
 * @param client Prisma client root dùng để mở transaction.
 * @param withdrawal Withdrawal cần fail.
 * @param reason Lý do fail lưu vào withdrawal.
 * @param now Mốc thời gian release hold.
 */
function markFailedAndReleaseHold(
  client: import("generated/prisma/client").PrismaClient,
  withdrawal: import("../../models").WalletWithdrawalRow,
  reason: string,
  now: Date,
): Effect.Effect<boolean> {
  return runPrismaTransaction(client, tx =>
    Effect.gen(function* () {
      const txWithdrawalRepo = makeWithdrawalRepository(tx);
      const txWalletHoldRepo = makeWalletHoldRepository(tx);
      const txWalletRepo = makeWalletCommandRepository(tx);

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
    defectOn(PrismaTransactionError),
  );
}
