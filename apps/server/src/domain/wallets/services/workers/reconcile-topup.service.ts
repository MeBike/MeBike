import type Stripe from "stripe";

import { Effect } from "effect";

import { env } from "@/config/env";
import { Prisma } from "@/infrastructure/prisma";

import type { TopupProviderError } from "../../domain-errors";
import type { PaymentAttemptRow } from "../../models";
import type { PaymentAttemptRepositoryType } from "../../repository/payment-attempt.repository";

import { PaymentAttemptRepository } from "../../repository/payment-attempt.repository";
import { settleSuccessfulTopup } from "../commands/settle-topup.service";
import { StripeTopupServiceTag } from "../providers/stripe-topup.service";

const TOPUP_RECONCILE_LIMIT = 100;

export type TopupReconcileAttemptOutcome
  = | { readonly status: "ignored"; readonly paymentAttemptId: string; readonly reason: string }
    | { readonly status: "pending"; readonly paymentAttemptId: string; readonly reason: string }
    | { readonly status: "failed"; readonly paymentAttemptId: string; readonly reason: string }
    | { readonly status: "succeeded"; readonly paymentAttemptId: string };

export type TopupReconcileSummary = {
  readonly scanned: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly pending: number;
  readonly ignored: number;
};

function getPaymentIntentId(value: Stripe.Checkout.Session["payment_intent"]): string | null {
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value : value.id;
}

function getExpandedPaymentIntent(value: Stripe.Checkout.Session["payment_intent"]): Stripe.PaymentIntent | null {
  return value && typeof value !== "string" ? value : null;
}

function reasonForPaymentIntentStatus(status: Stripe.PaymentIntent.Status): string {
  return `payment_intent_${status}`;
}

function failAttempt(
  repo: PaymentAttemptRepositoryType,
  attemptId: string,
  reason: string,
): Effect.Effect<TopupReconcileAttemptOutcome> {
  return repo.markFailedIfPending(attemptId, reason).pipe(
    Effect.map(updated =>
      updated
        ? { status: "failed", paymentAttemptId: attemptId, reason } satisfies TopupReconcileAttemptOutcome
        : { status: "ignored", paymentAttemptId: attemptId, reason: "already_processed" } satisfies TopupReconcileAttemptOutcome),
  );
}

function settlePaymentIntent(
  client: import("generated/prisma/client").PrismaClient,
  attempt: PaymentAttemptRow,
  paymentIntent: Stripe.PaymentIntent,
): Effect.Effect<TopupReconcileAttemptOutcome, TopupProviderError, PaymentAttemptRepository> {
  return Effect.gen(function* () {
    if (paymentIntent.status === "succeeded") {
      const amountReceived = paymentIntent.amount_received;
      const currency = paymentIntent.currency;
      if (typeof amountReceived !== "number" || !currency) {
        return { status: "pending", paymentAttemptId: attempt.id, reason: "missing_amount_or_currency" };
      }

      const receivedMinor = BigInt(amountReceived);
      const receivedCurrency = currency.toLowerCase();
      if (receivedMinor !== attempt.amountMinor || receivedCurrency !== attempt.currency.toLowerCase()) {
        const repo = yield* PaymentAttemptRepository;
        return yield* failAttempt(repo, attempt.id, "amount_or_currency_mismatch");
      }

      const outcome = yield* settleSuccessfulTopup(client, attempt, {
        providerRef: paymentIntent.id,
        amountMinor: receivedMinor,
        description: "Stripe top-up via PaymentSheet",
        hash: `stripe:payment_intent:${paymentIntent.id}`,
        errorOperation: "stripe.reconcile.paymentIntent",
      });

      if (outcome.status === "succeeded") {
        return outcome;
      }
      if (outcome.status === "failed") {
        return outcome;
      }
      return {
        status: "ignored",
        paymentAttemptId: attempt.id,
        reason: outcome.status === "ignored" ? outcome.reason : "already_processed",
      };
    }

    if (paymentIntent.status === "canceled" || paymentIntent.status === "requires_payment_method") {
      const repo = yield* PaymentAttemptRepository;
      return yield* failAttempt(repo, attempt.id, reasonForPaymentIntentStatus(paymentIntent.status));
    }

    return {
      status: "pending",
      paymentAttemptId: attempt.id,
      reason: reasonForPaymentIntentStatus(paymentIntent.status),
    };
  });
}

function settleCheckoutSession(
  client: import("generated/prisma/client").PrismaClient,
  attempt: PaymentAttemptRow,
  session: Stripe.Checkout.Session,
): Effect.Effect<TopupReconcileAttemptOutcome, TopupProviderError, PaymentAttemptRepository> {
  return Effect.gen(function* () {
    if (session.payment_status === "paid") {
      const amountTotal = session.amount_total;
      const currency = session.currency;
      if (typeof amountTotal !== "number" || !currency) {
        return { status: "pending", paymentAttemptId: attempt.id, reason: "missing_amount_or_currency" };
      }

      const receivedMinor = BigInt(amountTotal);
      const receivedCurrency = currency.toLowerCase();
      if (receivedMinor !== attempt.amountMinor || receivedCurrency !== attempt.currency.toLowerCase()) {
        const repo = yield* PaymentAttemptRepository;
        return yield* failAttempt(repo, attempt.id, "amount_or_currency_mismatch");
      }

      const outcome = yield* settleSuccessfulTopup(client, attempt, {
        providerRef: session.id,
        amountMinor: receivedMinor,
        description: "Stripe top-up",
        hash: `stripe:checkout:${session.id}`,
        errorOperation: "stripe.reconcile.checkoutSession",
      });

      if (outcome.status === "succeeded") {
        return outcome;
      }
      if (outcome.status === "failed") {
        return outcome;
      }
      return {
        status: "ignored",
        paymentAttemptId: attempt.id,
        reason: outcome.status === "ignored" ? outcome.reason : "already_processed",
      };
    }

    const paymentIntent = getExpandedPaymentIntent(session.payment_intent);
    if (paymentIntent) {
      return yield* settlePaymentIntent(client, attempt, paymentIntent);
    }

    if (session.status === "expired") {
      const repo = yield* PaymentAttemptRepository;
      return yield* failAttempt(repo, attempt.id, "checkout_session_expired");
    }

    const paymentIntentId = getPaymentIntentId(session.payment_intent);
    return {
      status: "pending",
      paymentAttemptId: attempt.id,
      reason: paymentIntentId ? "checkout_session_unpaid" : "checkout_session_missing_payment_intent",
    };
  });
}

export function reconcileTopupAttempt(
  attempt: PaymentAttemptRow,
): Effect.Effect<
  TopupReconcileAttemptOutcome,
  TopupProviderError,
  Prisma | PaymentAttemptRepository | StripeTopupServiceTag
> {
  return Effect.gen(function* () {
    if (attempt.status !== "PENDING") {
      return { status: "ignored", paymentAttemptId: attempt.id, reason: `status:${attempt.status}` };
    }

    if (!attempt.providerRef) {
      return { status: "pending", paymentAttemptId: attempt.id, reason: "missing_provider_ref" };
    }

    const stripe = yield* StripeTopupServiceTag;
    const { client } = yield* Prisma;

    if (attempt.providerRef.startsWith("cs_")) {
      const session = yield* stripe.retrieveCheckoutSession(attempt.providerRef);
      return yield* settleCheckoutSession(client, attempt, session);
    }

    if (attempt.providerRef.startsWith("pi_")) {
      const paymentIntent = yield* stripe.retrievePaymentIntent(attempt.providerRef);
      return yield* settlePaymentIntent(client, attempt, paymentIntent);
    }

    return { status: "pending", paymentAttemptId: attempt.id, reason: "unsupported_provider_ref" };
  });
}

export function sweepTopupReconciliation(
  now: Date = new Date(),
): Effect.Effect<
  TopupReconcileSummary,
  TopupProviderError,
  Prisma | PaymentAttemptRepository | StripeTopupServiceTag
> {
  return Effect.gen(function* () {
    const repo = yield* PaymentAttemptRepository;
    const staleMs = env.TOPUP_RECONCILE_STALE_MINUTES * 60 * 1000;
    const staleBefore = new Date(now.getTime() - staleMs);
    const attempts = yield* repo.findPendingTopupsBefore(staleBefore, TOPUP_RECONCILE_LIMIT);

    let succeeded = 0;
    let failed = 0;
    let pending = 0;
    let ignored = 0;

    for (const attempt of attempts) {
      const outcome = yield* reconcileTopupAttempt(attempt);
      if (outcome.status === "succeeded") {
        succeeded += 1;
      }
      else if (outcome.status === "failed") {
        failed += 1;
      }
      else if (outcome.status === "pending") {
        pending += 1;
      }
      else {
        ignored += 1;
      }
    }

    return {
      scanned: attempts.length,
      succeeded,
      failed,
      pending,
      ignored,
    } satisfies TopupReconcileSummary;
  });
}
