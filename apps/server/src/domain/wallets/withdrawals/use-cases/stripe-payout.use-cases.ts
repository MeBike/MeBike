import type Stripe from "stripe";

import { Effect, Match } from "effect";

import type {
  InsufficientWalletBalance,
  WalletHoldRepositoryError,
  WalletNotFound,
  WalletRepositoryError,
} from "@/domain/wallets/domain-errors";

import { WalletHoldServiceTag } from "@/domain/wallets/services/wallet-hold.service";
import { WalletServiceTag } from "@/domain/wallets/services/wallet.service";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { WithdrawalRepositoryError } from "../domain-errors";

import { WithdrawalServiceTag } from "../services/withdrawal.service";

export type StripePayoutOutcome
  = | { readonly status: "ignored"; readonly reason: string }
    | { readonly status: "missing"; readonly payoutId: string }
    | { readonly status: "succeeded"; readonly payoutId: string; readonly withdrawalId: string }
    | { readonly status: "failed"; readonly payoutId: string; readonly withdrawalId: string; readonly reason: string };

export function handleStripePayoutWebhookUseCase(
  event: Stripe.Event,
): Effect.Effect<
  StripePayoutOutcome,
  | WithdrawalRepositoryError
  | WalletHoldRepositoryError
  | WalletNotFound
  | WalletRepositoryError
  | InsufficientWalletBalance,
  Prisma | WithdrawalServiceTag | WalletServiceTag | WalletHoldServiceTag
> {
  return Effect.gen(function* () {
    if (!event.type.startsWith("payout.")) {
      return {
        status: "ignored",
        reason: `unsupported_event:${event.type}`,
      } satisfies StripePayoutOutcome;
    }

    const payout = event.data.object as Stripe.Payout;
    const payoutId = payout.id;
    const withdrawalService = yield* WithdrawalServiceTag;
    const walletService = yield* WalletServiceTag;
    const walletHoldService = yield* WalletHoldServiceTag;
    const { client } = yield* Prisma;
    const now = new Date();

    const withdrawalOrOutcome = yield* Match.value(
      yield* withdrawalService.findByStripePayoutId(payoutId),
    ).pipe(
      Match.tag("None", () => Effect.succeed({
        _tag: "Outcome",
        outcome: { status: "missing", payoutId } satisfies StripePayoutOutcome,
      } as const)),
      Match.tag("Some", ({ value }) => Effect.succeed({
        _tag: "Withdrawal",
        withdrawal: value,
      } as const)),
      Match.exhaustive,
    );

    return yield* Match.value(withdrawalOrOutcome).pipe(
      Match.tag("Outcome", ({ outcome }) => Effect.succeed(outcome)),
      Match.tag("Withdrawal", ({ withdrawal }) => Effect.gen(function* () {
        if (event.type === "payout.paid") {
          const updated = yield* runPrismaTransaction(client, tx =>
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

          if (!updated) {
            return { status: "ignored", reason: "already_processed" } satisfies StripePayoutOutcome;
          }

          return {
            status: "succeeded",
            payoutId,
            withdrawalId: withdrawal.id,
          } satisfies StripePayoutOutcome;
        }

        if (event.type === "payout.failed" || event.type === "payout.canceled") {
          const reason = payout.failure_message ?? event.type;
          const updated = yield* runPrismaTransaction(client, tx =>
            Effect.gen(function* () {
              const marked = yield* withdrawalService.markFailedInTx(tx, {
                withdrawalId: withdrawal.id,
                stripePayoutId: payoutId,
                failureReason: reason,
              });

              if (!marked) {
                return false;
              }

              const released = yield* walletHoldService.releaseByWithdrawalIdInTx(
                tx,
                withdrawal.id,
                now,
              );
              if (!released) {
                // Legacy rows may not have a hold; treat as already released.
                return true;
              }

              yield* walletService.releaseReservedBalanceInTx(tx, {
                walletId: withdrawal.walletId,
                amount: withdrawal.amount,
              });

              return true;
            })).pipe(
            Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
          );

          if (!updated) {
            return { status: "ignored", reason: "already_processed" } satisfies StripePayoutOutcome;
          }

          return {
            status: "failed",
            payoutId,
            withdrawalId: withdrawal.id,
            reason,
          } satisfies StripePayoutOutcome;
        }

        return {
          status: "ignored",
          reason: `unsupported_event:${event.type}`,
        } satisfies StripePayoutOutcome;
      })),
      Match.exhaustive,
    );
  });
}
