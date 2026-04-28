import { Effect, Match } from "effect";

import { defectOn } from "@/domain/shared";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { IncreaseBalanceInput } from "../../models";
import type { StripeWebhookOutcome } from "../providers/stripe-topup.service";

import { TopupProviderError, WalletNotFound as WalletNotFoundError } from "../../domain-errors";
import { makePaymentAttemptRepository } from "../../repository/payment-attempt.repository";
import { makeWalletRepository } from "../../repository/wallet.repository";

function creditWallet(
  repo: ReturnType<typeof makeWalletRepository>,
  input: IncreaseBalanceInput,
) {
  return repo.increaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new WalletNotFoundError({ userId: input.userId }))),
    Effect.catchTag("WalletUniqueViolation", () =>
      repo.findByUserId(input.userId).pipe(
        Effect.flatMap(maybeWallet =>
          maybeWallet._tag === "Some"
            ? Effect.succeed(maybeWallet.value)
            : Effect.fail(new WalletNotFoundError({ userId: input.userId }))),
      )),
  );
}

export function settleSuccessfulTopup(
  client: import("generated/prisma/client").PrismaClient,
  attempt: {
    readonly id: string;
    readonly userId: string;
    readonly currency: string;
  },
  input: {
    readonly providerRef: string;
    readonly amountMinor: bigint;
    readonly description: string;
    readonly hash: string;
    readonly errorOperation: string;
  },
): Effect.Effect<StripeWebhookOutcome, TopupProviderError> {
  return runPrismaTransaction(client, tx =>
    Effect.gen(function* () {
      const txPaymentAttemptRepo = makePaymentAttemptRepository(tx);
      const txWalletRepo = makeWalletRepository(tx);

      const updated = yield* txPaymentAttemptRepo.markSucceededIfPending(attempt.id, input.providerRef);
      if (!updated) {
        return { status: "ignored", reason: "already_processed" } as StripeWebhookOutcome;
      }

      const creditResult = yield* creditWallet(txWalletRepo, {
        userId: attempt.userId,
        amount: input.amountMinor,
        description: input.description,
        hash: input.hash,
        type: "DEPOSIT",
      }).pipe(Effect.either);

      return yield* Match.value(creditResult).pipe(
        Match.tag("Right", () =>
          Effect.succeed({ status: "succeeded", paymentAttemptId: attempt.id } as StripeWebhookOutcome)),
        Match.tag("Left", ({ left }) => {
          if (left._tag === "WalletNotFound") {
            return txPaymentAttemptRepo.markFailedIfPending(attempt.id, "wallet_missing").pipe(
              Effect.as({
                status: "failed",
                paymentAttemptId: attempt.id,
                reason: "wallet_missing",
              } as StripeWebhookOutcome),
            );
          }

          return Effect.fail(new TopupProviderError({
            operation: input.errorOperation,
            provider: "stripe",
            cause: left,
          }));
        }),
        Match.exhaustive,
      );
    })).pipe(
    defectOn(PrismaTransactionError),
  );
}
