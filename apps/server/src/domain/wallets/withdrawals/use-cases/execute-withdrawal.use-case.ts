import { Effect, Match } from "effect";

import type { UserRepositoryError } from "@/domain/users/domain-errors";
import type {
  WalletHoldRepositoryError,
  WalletRepositoryError,
} from "@/domain/wallets/domain-errors";

import { env } from "@/config/env";
import { UserServiceTag } from "@/domain/users/services/user.service";
import { WalletHoldServiceTag } from "@/domain/wallets/services/wallet-hold.service";
import { WalletServiceTag } from "@/domain/wallets/services/wallet.service";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type {
  WithdrawalNotFound,
  WithdrawalProviderError,

  WithdrawalRepositoryError,
} from "../domain-errors";

import {
  WithdrawalUserNotFound,
} from "../domain-errors";
import { StripeWithdrawalServiceTag } from "../services/stripe-withdrawal.service";
import { WithdrawalServiceTag } from "../services/withdrawal.service";

export type ExecuteWithdrawalOutcome
  = | { readonly status: "missing"; readonly withdrawalId: string }
    | { readonly status: "ignored"; readonly withdrawalId: string; readonly reason: string }
    | {
      readonly status: "processing";
      readonly withdrawalId: string;
      readonly transferId: string;
      readonly payoutId: string;
    }
    | { readonly status: "failed"; readonly withdrawalId: string; readonly reason: string };

function toMinorAmountNumber(amount: bigint): number | null {
  if (amount <= 0n) {
    return null;
  }
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }
  return Number(amount);
}

function getStripeErrorCode(cause: unknown): string | undefined {
  if (!cause || typeof cause !== "object") {
    return undefined;
  }
  if ("code" in cause && typeof (cause as { code?: unknown }).code === "string") {
    return (cause as { code: string }).code;
  }
  if ("raw" in cause && typeof (cause as { raw?: unknown }).raw === "object" && (cause as { raw?: unknown }).raw) {
    const raw = (cause as { raw: { code?: unknown } }).raw;
    if (typeof raw.code === "string") {
      return raw.code;
    }
  }
  return undefined;
}

export function executeWithdrawalUseCase(
  withdrawalId: string,
): Effect.Effect<
  ExecuteWithdrawalOutcome,
  | WithdrawalNotFound
  | WithdrawalProviderError
  | WithdrawalRepositoryError
  | WithdrawalUserNotFound
  | WalletHoldRepositoryError
  | WalletRepositoryError
  | UserRepositoryError,
  Prisma | WithdrawalServiceTag | WalletHoldServiceTag | WalletServiceTag | UserServiceTag | StripeWithdrawalServiceTag
> {
  return Effect.gen(function* () {
    const withdrawalService = yield* WithdrawalServiceTag;
    const walletHoldService = yield* WalletHoldServiceTag;
    const walletService = yield* WalletServiceTag;
    const userService = yield* UserServiceTag;
    const stripeService = yield* StripeWithdrawalServiceTag;
    const { client } = yield* Prisma;
    const now = new Date();
    const processingTtlMs = env.WITHDRAWAL_PROCESSING_TTL_MINUTES * 60 * 1000;
    const processingStaleBefore = new Date(now.getTime() - processingTtlMs);
    const slaMs = env.WITHDRAWAL_SLA_MINUTES * 60 * 1000;

    const withdrawalResult = yield* withdrawalService.getById(withdrawalId).pipe(
      Effect.either,
    );

    const withdrawalOrOutcome = yield* Match.value(withdrawalResult).pipe(
      Match.tag("Left", ({ left }) => {
        return Match.value(left).pipe(
          Match.tag("WithdrawalNotFound", () =>
            Effect.succeed({
              _tag: "Outcome",
              outcome: {
                status: "missing",
                withdrawalId,
              } satisfies ExecuteWithdrawalOutcome,
            } as const)),
          Match.orElse(() => Effect.fail(left)),
        );
      }),
      Match.tag("Right", ({ right }) => Effect.succeed({
        _tag: "Withdrawal",
        withdrawal: right,
      } as const)),
      Match.exhaustive,
    );

    return yield* Match.value(withdrawalOrOutcome).pipe(
      Match.tag("Outcome", ({ outcome }) => Effect.succeed(outcome)),
      Match.tag("Withdrawal", ({ withdrawal }) =>
        Effect.gen(function* () {
          if (withdrawal.status === "PROCESSING") {
            const isStale = withdrawal.updatedAt.getTime() <= processingStaleBefore.getTime();
            if (!isStale) {
              return {
                status: "ignored",
                withdrawalId,
                reason: "processing_locked",
              } satisfies ExecuteWithdrawalOutcome;
            }
          }
          else if (withdrawal.status !== "PENDING") {
            return {
              status: "ignored",
              withdrawalId,
              reason: `status:${withdrawal.status}`,
            } satisfies ExecuteWithdrawalOutcome;
          }

          const userOpt = yield* userService.getById(withdrawal.userId);
          const user = yield* Match.value(userOpt).pipe(
            Match.tag("Some", ({ value }) => Effect.succeed(value)),
            Match.tag("None", () => Effect.fail(new WithdrawalUserNotFound({ userId: withdrawal.userId }))),
            Match.exhaustive,
          );

          const accountId = user.stripeConnectedAccountId;
          if (!accountId) {
            return yield* markFailedAndReleaseHold(
              client,
              withdrawalService,
              walletHoldService,
              walletService,
              withdrawal,
              "stripe_account_missing",
            );
          }

          if (user.stripePayoutsEnabled !== true) {
            return yield* markFailedAndReleaseHold(
              client,
              withdrawalService,
              walletHoldService,
              walletService,
              withdrawal,
              "payouts_not_enabled",
            );
          }

          const amountMinor = toMinorAmountNumber(withdrawal.amount);
          if (!amountMinor) {
            return yield* markFailedAndReleaseHold(
              client,
              withdrawalService,
              walletHoldService,
              walletService,
              withdrawal,
              "amount_out_of_range",
            );
          }

          const marked = yield* runPrismaTransaction(client, tx =>
            withdrawalService.markProcessingInTx(tx, {
              withdrawalId,
              staleBefore: processingStaleBefore,
            })).pipe(
            Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
          );

          if (!marked) {
            return { status: "ignored", withdrawalId, reason: "already_processing" } satisfies ExecuteWithdrawalOutcome;
          }

          if (withdrawal.currency.toLowerCase() !== "usd") {
            return yield* markFailedAndReleaseHold(
              client,
              withdrawalService,
              walletHoldService,
              walletService,
              withdrawal,
              "unsupported_currency",
            );
          }

          const providerResult = yield* Effect.gen(function* () {
            const transfer = yield* stripeService.createTransfer({
              amountMinor,
              destinationAccountId: accountId,
              idempotencyKey: `${withdrawal.idempotencyKey}:transfer`,
              description: `Withdrawal ${withdrawal.id}`,
            });

            const payout = yield* stripeService.createPayout({
              amountMinor,
              accountId,
              idempotencyKey: `${withdrawal.idempotencyKey}:payout`,
              description: `Withdrawal ${withdrawal.id}`,
            });

            return { transfer, payout };
          }).pipe(Effect.either);

          if (providerResult._tag === "Left") {
            const errorCode = getStripeErrorCode(providerResult.left.cause);
            const slaExceeded = now.getTime() - withdrawal.createdAt.getTime() >= slaMs;
            if (errorCode === "balance_insufficient" && slaExceeded) {
              return yield* markFailedAndReleaseHold(
                client,
                withdrawalService,
                walletHoldService,
                walletService,
                withdrawal,
                "provider_balance_insufficient",
              );
            }
            return yield* Effect.fail(providerResult.left);
          }

          const { transfer, payout } = providerResult.right;

          yield* runPrismaTransaction(client, tx =>
            withdrawalService.setStripeRefsInTx(tx, {
              withdrawalId,
              stripeTransferId: transfer.id,
              stripePayoutId: payout.id,
            })).pipe(
            Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
          );

          return {
            status: "processing",
            withdrawalId,
            transferId: transfer.id,
            payoutId: payout.id,
          } satisfies ExecuteWithdrawalOutcome;
        })),
      Match.exhaustive,
    );
  });
}

function markFailedAndReleaseHold(
  client: import("generated/prisma/client").PrismaClient,
  withdrawalService: import("../services/withdrawal.service").WithdrawalService,
  walletHoldService: import("@/domain/wallets/services/wallet-hold.service").WalletHoldService,
  walletService: import("@/domain/wallets/services/wallet.service").WalletService,
  withdrawal: import("../models").WalletWithdrawalRow,
  reason: string,
): Effect.Effect<
  ExecuteWithdrawalOutcome,
  | WithdrawalRepositoryError
  | WalletHoldRepositoryError
  | WalletRepositoryError
> {
  return Effect.gen(function* () {
    const updated = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const markFailed = yield* withdrawalService.markFailedInTx(tx, {
          withdrawalId: withdrawal.id,
          failureReason: reason,
        });

        if (!markFailed) {
          return false;
        }

        yield* walletService.releaseReservedBalanceInTx(tx, {
          walletId: withdrawal.walletId,
          amount: withdrawal.amount,
        });

        const released = yield* walletHoldService.releaseByWithdrawalIdInTx(
          tx,
          withdrawal.id,
          new Date(),
        );
        if (!released) {
          // Legacy rows may not have a hold; treat as already released.
          return true;
        }

        return true;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    if (!updated) {
      return {
        status: "ignored",
        withdrawalId: withdrawal.id,
        reason: "already_processed",
      } satisfies ExecuteWithdrawalOutcome;
    }

    return {
      status: "failed",
      withdrawalId: withdrawal.id,
      reason,
    } satisfies ExecuteWithdrawalOutcome;
  });
}
