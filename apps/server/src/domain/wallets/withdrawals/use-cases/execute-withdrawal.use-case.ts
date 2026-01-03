import { Effect, Match } from "effect";

import type { UserRepositoryError } from "@/domain/users/domain-errors";
import type { WalletNotFound, WalletRepositoryError } from "@/domain/wallets/domain-errors";

import { env } from "@/config/env";
import { UserServiceTag } from "@/domain/users/services/user.service";
import { WalletServiceTag } from "@/domain/wallets/services/wallet.service";
import { Prisma } from "@/infrastructure/prisma";

import type {
  WithdrawalNotFound,
  WithdrawalProviderError,
} from "../domain-errors";

import {
  WithdrawalRepositoryError,
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

export function executeWithdrawalUseCase(
  withdrawalId: string,
): Effect.Effect<
  ExecuteWithdrawalOutcome,
  | WithdrawalNotFound
  | WithdrawalProviderError
  | WithdrawalRepositoryError
  | WithdrawalUserNotFound
  | WalletNotFound
  | WalletRepositoryError
  | UserRepositoryError,
  Prisma | WithdrawalServiceTag | WalletServiceTag | UserServiceTag | StripeWithdrawalServiceTag
> {
  return Effect.gen(function* () {
    const withdrawalService = yield* WithdrawalServiceTag;
    const walletService = yield* WalletServiceTag;
    const userService = yield* UserServiceTag;
    const stripeService = yield* StripeWithdrawalServiceTag;
    const { client } = yield* Prisma;
    const now = new Date();
    const processingTtlMs = env.WITHDRAWAL_PROCESSING_TTL_MINUTES * 60 * 1000;
    const processingStaleBefore = new Date(now.getTime() - processingTtlMs);

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

          if (!user.stripeConnectedAccountId) {
            return yield* markFailedAndRefund(
              client,
              withdrawalService,
              walletService,
              withdrawal,
              "stripe_account_missing",
            );
          }

          if (user.stripePayoutsEnabled !== true) {
            return yield* markFailedAndRefund(
              client,
              withdrawalService,
              walletService,
              withdrawal,
              "payouts_not_enabled",
            );
          }

          const amountMinor = toMinorAmountNumber(withdrawal.amount);
          if (!amountMinor) {
            return yield* markFailedAndRefund(
              client,
              withdrawalService,
              walletService,
              withdrawal,
              "amount_out_of_range",
            );
          }

          const marked = yield* Effect.tryPromise({
            try: () =>
              client.$transaction(async tx =>
                Effect.runPromise(
                  withdrawalService.markProcessingInTx(tx, {
                    withdrawalId,
                    staleBefore: processingStaleBefore,
                  }),
                )),
            catch: cause =>
              new WithdrawalRepositoryError({
                operation: "markProcessingInTx",
                cause,
              }),
          });

          if (!marked) {
            return { status: "ignored", withdrawalId, reason: "already_processing" } satisfies ExecuteWithdrawalOutcome;
          }

          const transfer = yield* stripeService.createTransfer({
            amountMinor,
            currency: withdrawal.currency,
            destinationAccountId: user.stripeConnectedAccountId,
            idempotencyKey: `${withdrawal.idempotencyKey}:transfer`,
            description: `Withdrawal ${withdrawal.id}`,
          });

          const payout = yield* stripeService.createPayout({
            amountMinor,
            currency: withdrawal.currency,
            accountId: user.stripeConnectedAccountId,
            idempotencyKey: `${withdrawal.idempotencyKey}:payout`,
            description: `Withdrawal ${withdrawal.id}`,
          });

          yield* Effect.tryPromise({
            try: () =>
              client.$transaction(async tx =>
                Effect.runPromise(
                  withdrawalService.setStripeRefsInTx(tx, {
                    withdrawalId,
                    stripeTransferId: transfer.id,
                    stripePayoutId: payout.id,
                  }),
                )),
            catch: cause =>
              new WithdrawalRepositoryError({
                operation: "setStripeRefsInTx",
                cause,
              }),
          });

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

function markFailedAndRefund(
  client: import("generated/prisma/client").PrismaClient,
  withdrawalService: import("../services/withdrawal.service").WithdrawalService,
  walletService: import("@/domain/wallets/services/wallet.service").WalletService,
  withdrawal: import("../models").WalletWithdrawalRow,
  reason: string,
): Effect.Effect<
  ExecuteWithdrawalOutcome,
  | WithdrawalRepositoryError
  | WalletNotFound
  | WalletRepositoryError
> {
  return Effect.gen(function* () {
    type TxEither = import("effect").Either.Either<
      boolean,
      WithdrawalRepositoryError | WalletNotFound | WalletRepositoryError
    >;

    // TODO(HOTFIX): Transaction does NOT rollback on domain failures due to Effect.either wrapping.
    // When domain errors occur (e.g. WalletNotFound), the Promise resolves with Left(error)
    // instead of rejecting, causing Prisma to COMMIT partial writes (e.g. withdrawal marked failed
    // but wallet not refunded). This is a CRITICAL financial integrity bug.
    // Fix: Remove Effect.either wrapper and let failures throw naturally to trigger rollback.
    const txEither = yield* Effect.tryPromise<TxEither, WithdrawalRepositoryError>({
      try: () =>
        client.$transaction(async (tx) => {
          const eff: Effect.Effect<
            boolean,
            WithdrawalRepositoryError | WalletNotFound | WalletRepositoryError,
            never
          > = Effect.gen(function* () {
            const markFailed = yield* withdrawalService.markFailedInTx(tx, {
              withdrawalId: withdrawal.id,
              failureReason: reason,
            });

            if (!markFailed) {
              return false;
            }

            yield* walletService.creditWalletInTx(tx, {
              userId: withdrawal.userId,
              amount: withdrawal.amount,
              description: "Withdrawal failed refund",
              hash: `withdrawal:refund:${withdrawal.id}`,
              type: "REFUND",
            });

            return true;
          });

          return Effect.runPromise(eff.pipe(Effect.either)) as Promise<TxEither>;
        }),
      catch: err =>
        new WithdrawalRepositoryError({
          operation: "markFailedAndRefund",
          cause: err,
        }),
    });

    const updated = yield* Match.value(txEither).pipe(
      Match.tag("Right", ({ right }) => Effect.succeed(right)),
      Match.tag("Left", ({ left }) => Effect.fail(left)),
      Match.exhaustive,
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
