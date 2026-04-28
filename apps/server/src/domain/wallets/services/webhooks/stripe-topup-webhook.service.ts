import type Stripe from "stripe";

import { Effect, Match } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import type { StripeWebhookOutcome } from "../providers/stripe-topup.service";

import { TopupProviderError } from "../../domain-errors";
import { makePaymentAttemptRepository } from "../../repository/payment-attempt.repository";
import { settleSuccessfulTopup } from "../commands/settle-topup.service";
import { StripeTopupServiceTag } from "../providers/stripe-topup.service";

function matchAttemptOption<A>(
  effect: Effect.Effect<{ _tag: "Some"; value: A } | { _tag: "None" }>,
) {
  return Effect.flatMap(effect, attemptOpt =>
    Match.value(attemptOpt).pipe(
      Match.tag("Some", ({ value }) => Effect.succeed(value)),
      Match.tag("None", () => Effect.succeed(null)),
      Match.exhaustive,
    ));
}

export function handleStripeTopupWebhookEvent(
  event: Stripe.Event,
): Effect.Effect<
  StripeWebhookOutcome,
  TopupProviderError,
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

    if (receivedMinor !== attempt.amountMinor || receivedCurrency !== attempt.currency.toLowerCase()) {
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

    return yield* settleSuccessfulTopup(client, attempt, {
      providerRef: session.id,
      amountMinor: receivedMinor,
      description: "Stripe top-up",
      hash: `stripe:checkout:${session.id}`,
      errorOperation: "stripe.webhook.handleCheckoutSession",
    });
  });
}

export function handleStripePaymentIntentWebhookEvent(
  event: Stripe.Event,
): Effect.Effect<
  StripeWebhookOutcome,
  TopupProviderError,
  StripeTopupServiceTag | Prisma
> {
  return Effect.gen(function* () {
    const service = yield* StripeTopupServiceTag;
    const { client } = yield* Prisma;

    if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
      return { status: "ignored", reason: `unsupported_event:${event.type}` };
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const attempt = yield* matchAttemptOption(service.resolveAttemptForPaymentIntent(paymentIntent));

    if (!attempt) {
      return paymentIntent.metadata?.paymentAttemptId
        ? { status: "missing", providerRef: paymentIntent.id }
        : { status: "ignored", reason: "untracked_payment_intent" };
    }

    if (attempt.status !== "PENDING") {
      return { status: "ignored", reason: `already_${attempt.status.toLowerCase()}` };
    }

    if (event.type === "payment_intent.payment_failed") {
      const reason = paymentIntent.last_payment_error?.message ?? "payment_failed";
      yield* Effect.tryPromise({
        try: () =>
          client.$transaction(async (tx) => {
            const txRepo = makePaymentAttemptRepository(tx);
            await Effect.runPromise(txRepo.markFailedIfPending(attempt.id, reason));
          }),
        catch: cause =>
          new TopupProviderError({
            operation: "stripe.webhook.paymentIntentFailed",
            provider: "stripe",
            cause,
          }),
      });

      return { status: "failed", paymentAttemptId: attempt.id, reason };
    }

    const amountReceived = paymentIntent.amount_received;
    const currency = paymentIntent.currency;
    if (typeof amountReceived !== "number" || !currency) {
      return { status: "ignored", reason: "missing_amount_or_currency" };
    }

    const receivedMinor = BigInt(amountReceived);
    const receivedCurrency = currency.toLowerCase();

    if (receivedMinor !== attempt.amountMinor || receivedCurrency !== attempt.currency.toLowerCase()) {
      const reason = "amount_or_currency_mismatch";
      yield* Effect.tryPromise({
        try: () =>
          client.$transaction(async (tx) => {
            const txRepo = makePaymentAttemptRepository(tx);
            await Effect.runPromise(txRepo.markFailedIfPending(attempt.id, reason));
          }),
        catch: cause =>
          new TopupProviderError({
            operation: "stripe.webhook.paymentIntentMismatch",
            provider: "stripe",
            cause,
          }),
      });

      return { status: "failed", paymentAttemptId: attempt.id, reason };
    }

    return yield* settleSuccessfulTopup(client, attempt, {
      providerRef: paymentIntent.id,
      amountMinor: receivedMinor,
      description: "Stripe top-up via PaymentSheet",
      hash: `stripe:payment_intent:${paymentIntent.id}`,
      errorOperation: "stripe.webhook.handlePaymentIntent",
    });
  });
}
