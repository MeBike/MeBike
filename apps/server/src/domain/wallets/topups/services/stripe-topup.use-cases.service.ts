import type Stripe from "stripe";

import { Effect, Match } from "effect";

import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { WalletNotFound, WalletRepositoryError } from "../../domain-errors";
import type { IncreaseBalanceInput } from "../../models";
import type { InvalidTopupRequest, PaymentAttemptRepositoryError, PaymentAttemptUniqueViolation } from "../domain-errors";
import type { StripeCheckoutAttemptInput, StripeTopupSessionResult, StripeWebhookOutcome } from "../services/stripe-topup.service";

import { WalletNotFound as WalletNotFoundError } from "../../domain-errors";
import { makeWalletRepository } from "../../repository/wallet.repository";
import { WalletServiceTag } from "../../services/wallet.service";
import { TopupProviderError } from "../domain-errors";
import { makePaymentAttemptRepository } from "../repository/payment-attempt.repository";
import { StripeTopupServiceTag } from "../services/stripe-topup.service";

// TODO(future): Add a Stripe Connect-based “top-up” flow (destination charge or direct charge),
// so Stripe balances move realistically (platform/connected) instead of only crediting the internal wallet ledger.
//
// Option A — Destination charge (platform creates payment, Stripe transfers to connected):
// - Create PaymentIntent/Checkout Session on platform with:
//   - amount, currency
//   - transfer_data[destination] = connectedAccountId (acct_...)
//   - optional application_fee_amount (platform fee)
// - Confirm on client (or redirect via Checkout).
// - Webhook marks payment succeeded and (optionally) credits internal wallet.
//
// Option B — Direct charge (payment created on connected account):
// - Create PaymentIntent on connected account (Stripe-Account header / stripeAccount option).
// - Optional application_fee_amount for platform fee.
// - Confirm on client; webhook finalizes.
//
// API shape idea:
// - POST /payments/intent { amountMinor, currency, connectedAccountId, applicationFeeMinor? } -> client_secret
// - Webhooks handle payment status; avoid “credit on request” behavior.
// Notes:
// - Validate connectedAccountId authz (must belong to caller/merchant).
// - Expect KYC/capabilities gating for live payouts/withdrawals.

export type CreateStripeCheckoutSessionInput = Omit<
  StripeCheckoutAttemptInput,
  "walletId"
> & {
  readonly successUrl: string;
  readonly cancelUrl: string;
};

export function createStripeCheckoutSessionUseCase(
  input: CreateStripeCheckoutSessionInput,
): Effect.Effect<
  StripeTopupSessionResult,
  InvalidTopupRequest | TopupProviderError | PaymentAttemptRepositoryError | PaymentAttemptUniqueViolation | WalletNotFound | WalletRepositoryError,
  StripeTopupServiceTag | WalletServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* StripeTopupServiceTag;
    const walletService = yield* WalletServiceTag;
    const wallet = yield* walletService.getByUserId(input.userId);

    const prepared = yield* service.prepareCheckoutAttempt({
      userId: input.userId,
      walletId: wallet.id,
      amountMinor: input.amountMinor,
    });

    const session = yield* service.createCheckoutSession({
      attempt: prepared.attempt,
      walletId: wallet.id,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });

    yield* service.attachProviderRef(prepared.attempt.id, session.sessionId);

    return {
      paymentAttemptId: prepared.attempt.id,
      checkoutUrl: session.checkoutUrl,
    };
  });
}

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

export function handleStripeTopupWebhookEventUseCase(
  event: Stripe.Event,
): Effect.Effect<
  StripeWebhookOutcome,
  TopupProviderError | PaymentAttemptRepositoryError,
  StripeTopupServiceTag | Prisma
> {
  return Effect.gen(function* () {
    const service = yield* StripeTopupServiceTag;
    const { client } = yield* Prisma;

    if (event.type !== "checkout.session.completed") {
      return { status: "ignored", reason: `unsupported_event:${event.type}` };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") {
      return { status: "ignored", reason: `payment_status:${session.payment_status}` };
    }

    const attemptOpt = yield* service.resolveAttemptForSession(session);
    const attempt = yield* Match.value(attemptOpt).pipe(
      Match.tag("Some", ({ value }) => Effect.succeed(value)),
      Match.tag("None", () => Effect.succeed(null)),
      Match.exhaustive,
    );

    if (!attempt) {
      return { status: "missing", providerRef: session.id };
    }

    if (attempt.status !== "PENDING") {
      return { status: "ignored", reason: `already_${attempt.status.toLowerCase()}` };
    }

    const amountTotal = session.amount_total;
    const currency = session.currency;
    if (typeof amountTotal !== "number" || !currency) {
      return { status: "ignored", reason: "missing_amount_or_currency" };
    }

    const receivedMinor = BigInt(amountTotal);
    const receivedCurrency = currency.toLowerCase();

    if (receivedMinor !== attempt.amountMinor || receivedCurrency !== "usd") {
      const reason = "amount_or_currency_mismatch";
      yield* Effect.tryPromise({
        try: () =>
          client.$transaction(async (tx) => {
            const txRepo = makePaymentAttemptRepository(tx);
            await Effect.runPromise(txRepo.markFailedIfPending(attempt.id, reason));
          }),
        catch: cause =>
          new TopupProviderError({
            operation: "stripe.webhook.mismatch",
            provider: "stripe",
            cause,
          }),
      });
      return { status: "failed", paymentAttemptId: attempt.id, reason };
    }

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const txPaymentAttemptRepo = makePaymentAttemptRepository(tx);
        const txWalletRepo = makeWalletRepository(tx);

        const updated = yield* txPaymentAttemptRepo.markSucceededIfPending(attempt.id, session.id);
        if (!updated) {
          return { status: "ignored", reason: "already_processed" } as StripeWebhookOutcome;
        }

        const creditResult = yield* creditWallet(txWalletRepo, {
          userId: attempt.userId,
          amount: receivedMinor,
          description: "Stripe top-up",
          hash: `stripe:checkout:${session.id}`,
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
              operation: "stripe.webhook.handleCheckoutSession",
              provider: "stripe",
              cause: left,
            }));
          }),
          Match.exhaustive,
        );
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );
  });
}
