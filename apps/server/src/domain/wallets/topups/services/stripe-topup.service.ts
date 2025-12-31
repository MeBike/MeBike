import type { Option } from "effect";
import type Stripe from "stripe";

import { Context, Effect, Layer } from "effect";

import { StripeClient } from "@/infrastructure/stripe";

import type { PaymentAttemptRepositoryError, PaymentAttemptUniqueViolation } from "../domain-errors";
import type { PaymentAttemptRow } from "../models";

import { InvalidTopupRequest, TopupProviderError } from "../domain-errors";
import { PaymentAttemptRepository } from "../repository/payment-attempt.repository";

export type StripeCheckoutAttemptInput = {
  readonly userId: string;
  readonly walletId: string;
  readonly amountMinor: number;
  readonly currency: string;
};

export type StripeTopupSessionResult = {
  readonly paymentAttemptId: string;
  readonly checkoutUrl: string;
};

export type StripeWebhookOutcome
  = | { readonly status: "ignored"; readonly reason: string }
    | { readonly status: "missing"; readonly providerRef: string }
    | { readonly status: "failed"; readonly paymentAttemptId: string; readonly reason: string }
    | { readonly status: "succeeded"; readonly paymentAttemptId: string };

export type StripeTopupService = {
  prepareCheckoutAttempt: (
    input: StripeCheckoutAttemptInput,
  ) => Effect.Effect<
    { readonly attempt: PaymentAttemptRow },
    InvalidTopupRequest | PaymentAttemptRepositoryError | PaymentAttemptUniqueViolation
  >;
  createCheckoutSession: (
    input: {
      readonly attempt: PaymentAttemptRow;
      readonly walletId: string;
      readonly successUrl: string;
      readonly cancelUrl: string;
    },
  ) => Effect.Effect<{ readonly sessionId: string; readonly checkoutUrl: string }, TopupProviderError>;
  attachProviderRef: (
    attemptId: string,
    providerRef: string,
  ) => Effect.Effect<PaymentAttemptRow, PaymentAttemptRepositoryError | PaymentAttemptUniqueViolation>;
  resolveAttemptForSession: (
    session: Stripe.Checkout.Session,
  ) => Effect.Effect<Option.Option<PaymentAttemptRow>, PaymentAttemptRepositoryError>;
  markFailedIfPendingInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    attemptId: string,
    reason: string,
  ) => Effect.Effect<boolean, PaymentAttemptRepositoryError>;
  markSucceededIfPendingInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    attemptId: string,
    providerRef: string,
  ) => Effect.Effect<boolean, PaymentAttemptRepositoryError>;
};

export class StripeTopupServiceTag extends Context.Tag("StripeTopupService")<
  StripeTopupServiceTag,
  StripeTopupService
>() {}

function isValidMinorAmount(amount: number) {
  return Number.isInteger(amount) && amount > 0;
}

function buildSessionMetadata(attempt: PaymentAttemptRow, walletId: string) {
  return {
    paymentAttemptId: attempt.id,
    userId: attempt.userId,
    walletId,
    kind: attempt.kind,
  };
}

export const StripeTopupServiceLive = Layer.effect(
  StripeTopupServiceTag,
  Effect.gen(function* () {
    const stripe = (yield* StripeClient).client;
    const repo = yield* PaymentAttemptRepository;

    const prepareCheckoutAttempt: StripeTopupService["prepareCheckoutAttempt"] = input =>
      Effect.gen(function* () {
        if (!isValidMinorAmount(input.amountMinor)) {
          return yield* Effect.fail(new InvalidTopupRequest({
            message: "amountMinor must be a positive integer in minor units.",
          }));
        }

        const currency = input.currency.toLowerCase();

        const attempt = yield* repo.create({
          userId: input.userId,
          walletId: input.walletId,
          provider: "STRIPE",
          kind: "TOPUP",
          amountMinor: BigInt(input.amountMinor),
          currency,
          metadata: { mode: "checkout" },
        });

        return { attempt };
      });

    const createCheckoutSession: StripeTopupService["createCheckoutSession"] = input =>
      Effect.gen(function* () {
        const currency = input.attempt.currency.toLowerCase();
        const amountMinor = Number(input.attempt.amountMinor);

        const session = yield* Effect.tryPromise({
          try: () =>
            stripe.checkout.sessions.create({
              mode: "payment",
              success_url: input.successUrl,
              cancel_url: input.cancelUrl,
              line_items: [
                {
                  quantity: 1,
                  price_data: {
                    currency,
                    unit_amount: amountMinor,
                    product_data: {
                      name: "Wallet top-up",
                    },
                  },
                },
              ],
              metadata: buildSessionMetadata(input.attempt, input.walletId),
            }, { idempotencyKey: input.attempt.id }),
          catch: cause =>
            new TopupProviderError({
              operation: "stripe.checkout.sessions.create",
              provider: "stripe",
              cause,
            }),
        });

        if (!session.url) {
          return yield* Effect.fail(new TopupProviderError({
            operation: "stripe.checkout.sessions.create",
            provider: "stripe",
            message: "Stripe checkout session did not return a URL.",
          }));
        }

        return { sessionId: session.id, checkoutUrl: session.url };
      });

    const attachProviderRef: StripeTopupService["attachProviderRef"] = (attemptId, providerRef) =>
      repo.setProviderRef(attemptId, providerRef);

    const resolveAttemptForSession: StripeTopupService["resolveAttemptForSession"] = (session) => {
      const providerRef = session.id;
      const metadataAttemptId = session.metadata?.paymentAttemptId;
      return metadataAttemptId
        ? repo.findById(metadataAttemptId)
        : repo.findByProviderRef("STRIPE", providerRef);
    };

    const markFailedIfPendingInTx: StripeTopupService["markFailedIfPendingInTx"] = (tx, attemptId, reason) =>
      repo.markFailedIfPendingInTx(tx, attemptId, reason);

    const markSucceededIfPendingInTx: StripeTopupService["markSucceededIfPendingInTx"] = (tx, attemptId, providerRef) =>
      repo.markSucceededIfPendingInTx(tx, attemptId, providerRef);

    const service: StripeTopupService = {
      prepareCheckoutAttempt,
      createCheckoutSession,
      attachProviderRef,
      resolveAttemptForSession,
      markFailedIfPendingInTx,
      markSucceededIfPendingInTx,
    };

    return service;
  }),
);
