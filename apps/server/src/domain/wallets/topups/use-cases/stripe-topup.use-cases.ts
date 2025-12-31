import type Stripe from "stripe";

import { Effect, Match } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import type { WalletNotFound, WalletRepositoryError } from "../../domain-errors";
import type { InvalidTopupRequest, PaymentAttemptRepositoryError, PaymentAttemptUniqueViolation } from "../domain-errors";
import type { StripeCheckoutAttemptInput, StripeTopupSessionResult, StripeWebhookOutcome } from "../services/stripe-topup.service";

import { WalletServiceTag } from "../../services/wallet.service";
import { TopupProviderError } from "../domain-errors";
import { StripeTopupServiceTag } from "../services/stripe-topup.service";

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
      currency: input.currency,
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

export function handleStripeWebhookEventUseCase(
  event: Stripe.Event,
): Effect.Effect<
  StripeWebhookOutcome,
  TopupProviderError | PaymentAttemptRepositoryError,
  StripeTopupServiceTag | Prisma | WalletServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* StripeTopupServiceTag;
    const walletService = yield* WalletServiceTag;
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
    const expectedCurrency = attempt.currency.toLowerCase();
    const receivedCurrency = currency.toLowerCase();

    if (receivedMinor !== attempt.amountMinor || receivedCurrency !== expectedCurrency) {
      const reason = "amount_or_currency_mismatch";
      yield* Effect.tryPromise({
        try: () =>
          client.$transaction(async (tx) => {
            await Effect.runPromise(service.markFailedIfPendingInTx(tx, attempt.id, reason));
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

    return yield* Effect.tryPromise({
      try: () =>
        client.$transaction(async (tx) => {
          const updated = await Effect.runPromise(
            service.markSucceededIfPendingInTx(tx, attempt.id, session.id),
          );
          if (!updated) {
            return { status: "ignored", reason: "already_processed" } as StripeWebhookOutcome;
          }

          const creditResult = await Effect.runPromise(
            walletService.creditWalletInTx(tx, {
              userId: attempt.userId,
              amount: receivedMinor,
              description: "Stripe top-up",
              hash: `stripe:checkout:${session.id}`,
              type: "DEPOSIT",
            }).pipe(Effect.either),
          );

          return Match.value(creditResult).pipe(
            Match.tag("Right", () =>
              ({ status: "succeeded", paymentAttemptId: attempt.id } as StripeWebhookOutcome)),
            Match.tag("Left", ({ left }) => {
              if (left._tag === "WalletNotFound") {
                return Effect.runPromise(
                  service.markFailedIfPendingInTx(tx, attempt.id, "wallet_missing"),
                ).then(() => ({
                  status: "failed",
                  paymentAttemptId: attempt.id,
                  reason: "wallet_missing",
                } as StripeWebhookOutcome));
              }
              throw left;
            }),
            Match.exhaustive,
          );
        }),
      catch: cause =>
        new TopupProviderError({
          operation: "stripe.webhook.handleCheckoutSession",
          provider: "stripe",
          cause,
        }),
    });
  });
}
