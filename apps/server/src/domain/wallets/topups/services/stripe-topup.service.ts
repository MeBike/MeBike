import type { Option } from "effect";
import type Stripe from "stripe";

import { Context, Effect, Layer } from "effect";

import { StripeClient } from "@/infrastructure/stripe";

import type { PaymentAttemptUniqueViolation } from "../domain-errors";
import type { PaymentAttemptRow } from "../models";

import { InvalidTopupRequest, TopupProviderError } from "../domain-errors";
import { PaymentAttemptRepository } from "../repository/payment-attempt.repository";

export type StripeCheckoutAttemptInput = {
  readonly userId: string;
  readonly walletId: string;
  readonly amountMinor: number;
};

export type StripeTopupSessionResult = {
  readonly paymentAttemptId: string;
  readonly checkoutUrl: string;
};

export type StripeTopupPaymentSheetResult = {
  readonly paymentAttemptId: string;
  readonly paymentIntentClientSecret: string;
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
    InvalidTopupRequest | PaymentAttemptUniqueViolation
  >;
  preparePaymentSheetAttempt: (
    input: StripeCheckoutAttemptInput,
  ) => Effect.Effect<
    { readonly attempt: PaymentAttemptRow },
    InvalidTopupRequest | PaymentAttemptUniqueViolation
  >;
  createCheckoutSession: (
    input: {
      readonly attempt: PaymentAttemptRow;
      readonly successUrl: string;
      readonly cancelUrl: string;
    },
  ) => Effect.Effect<{ readonly sessionId: string; readonly checkoutUrl: string }, TopupProviderError>;
  createPaymentIntent: (
    input: {
      readonly attempt: PaymentAttemptRow;
    },
  ) => Effect.Effect<
    { readonly paymentIntentId: string; readonly clientSecret: string },
    TopupProviderError
  >;
  attachProviderRef: (
    attemptId: string,
    providerRef: string,
  ) => Effect.Effect<PaymentAttemptRow, PaymentAttemptUniqueViolation>;
  resolveAttemptForSession: (
    session: Stripe.Checkout.Session,
  ) => Effect.Effect<Option.Option<PaymentAttemptRow>>;
  resolveAttemptForPaymentIntent: (
    paymentIntent: Stripe.PaymentIntent,
  ) => Effect.Effect<Option.Option<PaymentAttemptRow>>;
};

export class StripeTopupServiceTag extends Context.Tag("StripeTopupService")<
  StripeTopupServiceTag,
  StripeTopupService
>() {}

function isValidMinorAmount(amount: number) {
  return Number.isInteger(amount) && amount > 0;
}

function buildAttemptMetadata(attempt: PaymentAttemptRow) {
  return {
    paymentAttemptId: attempt.id,
    userId: attempt.userId,
    walletId: attempt.walletId,
    kind: attempt.kind,
  };
}

export const StripeTopupServiceLive = Layer.effect(
  StripeTopupServiceTag,
  Effect.gen(function* () {
    const stripe = (yield* StripeClient).client;
    const repo = yield* PaymentAttemptRepository;

    const prepareAttempt = (
      input: StripeCheckoutAttemptInput,
      mode: "checkout" | "payment_sheet",
    ) =>
      Effect.gen(function* () {
        if (!isValidMinorAmount(input.amountMinor)) {
          return yield* Effect.fail(new InvalidTopupRequest({
            message: "amountMinor must be a positive integer in minor units.",
          }));
        }

        const currency = "vnd";

        const attempt = yield* repo.create({
          userId: input.userId,
          walletId: input.walletId,
          provider: "STRIPE",
          kind: "TOPUP",
          amountMinor: BigInt(input.amountMinor),
          currency,
          metadata: { mode },
        });

        return { attempt };
      });

    const prepareCheckoutAttempt: StripeTopupService["prepareCheckoutAttempt"] = input =>
      prepareAttempt(input, "checkout");

    const preparePaymentSheetAttempt: StripeTopupService["preparePaymentSheetAttempt"] = input =>
      prepareAttempt(input, "payment_sheet");

    const createCheckoutSession: StripeTopupService["createCheckoutSession"] = input =>
      Effect.gen(function* () {
        const currency = "vnd";
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
              metadata: buildAttemptMetadata(input.attempt),
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

    const createPaymentIntent: StripeTopupService["createPaymentIntent"] = input =>
      Effect.gen(function* () {
        const paymentIntent = yield* Effect.tryPromise({
          try: () =>
            stripe.paymentIntents.create({
              amount: Number(input.attempt.amountMinor),
              currency: input.attempt.currency,
              automatic_payment_methods: { enabled: true },
              metadata: buildAttemptMetadata(input.attempt),
              description: "Wallet top-up",
            }, { idempotencyKey: input.attempt.id }),
          catch: cause =>
            new TopupProviderError({
              operation: "stripe.paymentIntents.create",
              provider: "stripe",
              cause,
            }),
        });

        if (!paymentIntent.client_secret) {
          return yield* Effect.fail(new TopupProviderError({
            operation: "stripe.paymentIntents.create",
            provider: "stripe",
            message: "Stripe PaymentIntent did not return a client secret.",
          }));
        }

        return {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        };
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

    const resolveAttemptForPaymentIntent: StripeTopupService["resolveAttemptForPaymentIntent"] = (paymentIntent) => {
      const providerRef = paymentIntent.id;
      const metadataAttemptId = paymentIntent.metadata?.paymentAttemptId;
      return metadataAttemptId
        ? repo.findById(metadataAttemptId)
        : repo.findByProviderRef("STRIPE", providerRef);
    };

    const service: StripeTopupService = {
      prepareCheckoutAttempt,
      preparePaymentSheetAttempt,
      createCheckoutSession,
      createPaymentIntent,
      attachProviderRef,
      resolveAttemptForSession,
      resolveAttemptForPaymentIntent,
    };

    return service;
  }),
);
