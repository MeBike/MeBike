import type Stripe from "stripe";

import { Effect, Match } from "effect";

import type {
  WalletBalanceConstraint,
  WalletHoldRepositoryError,
  WalletRepositoryError,
} from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";

import {
  InsufficientWalletBalance,
  WalletNotFound,
} from "@/domain/wallets/domain-errors";
import { makeWalletHoldRepository } from "@/domain/wallets/repository/wallet-hold.repository";
import { makeWalletRepository } from "@/domain/wallets/repository/wallet.repository";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { WithdrawalRepositoryError } from "../domain-errors";

import { makeWithdrawalRepository, WithdrawalRepository } from "../repository/withdrawal.repository";

export type StripePayoutOutcome
  = | { readonly status: "ignored"; readonly reason: string }
    | { readonly status: "missing"; readonly payoutId: string }
    | { readonly status: "succeeded"; readonly payoutId: string; readonly withdrawalId: string }
    | { readonly status: "failed"; readonly payoutId: string; readonly withdrawalId: string; readonly reason: string };

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

export function handleStripePayoutWebhookUseCase(
  event: Stripe.Event,
): Effect.Effect<
  StripePayoutOutcome,
  | WithdrawalRepositoryError
  | WalletHoldRepositoryError
  | WalletNotFound
  | WalletRepositoryError
  | InsufficientWalletBalance,
  Prisma | WithdrawalRepository
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
    const withdrawalRepo = yield* WithdrawalRepository;
    const { client } = yield* Prisma;
    const now = new Date();

    const withdrawalOrOutcome = yield* Match.value(
      yield* withdrawalRepo.findByStripePayoutId(payoutId),
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
              const txWithdrawalRepo = makeWithdrawalRepository(tx);
              const txWalletHoldRepo = makeWalletHoldRepository(tx);
              const txWalletRepo = makeWalletRepository(tx);

              const marked = yield* txWithdrawalRepo.markFailed({
                withdrawalId: withdrawal.id,
                stripePayoutId: payoutId,
                failureReason: reason,
              });

              if (!marked) {
                return false;
              }

              const released = yield* txWalletHoldRepo.releaseByWithdrawalId(
                withdrawal.id,
                now,
              );
              if (!released) {
                // Legacy rows may not have a hold; treat as already released.
                return true;
              }

              yield* txWalletRepo.releaseReservedBalance({
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
