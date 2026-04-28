import type { Option } from "effect";
import type Stripe from "stripe";

import { Context, Effect, Layer } from "effect";

import { StripeClient } from "@/infrastructure/stripe";

import type { PaymentAttemptUniqueViolation } from "../../domain-errors";
import type { PaymentAttemptRow } from "../../models";

import { InvalidTopupRequest, TopupProviderError } from "../../domain-errors";
import { PaymentAttemptRepository } from "../../repository/payment-attempt.repository";

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

/**
 * Provider adapter cho Stripe top-up.
 *
 * Service này là nơi duy nhất tạo/retrieve Stripe Checkout Session hoặc PaymentIntent.
 * Domain command/webhook/reconcile layer chỉ làm việc qua contract này.
 */
export type StripeTopupService = {
  /**
   * Tạo payment attempt pending cho Checkout top-up.
   *
   * @param input Dữ liệu attempt top-up.
   * @param input.userId ID user nạp tiền.
   * @param input.walletId ID wallet nhận tiền.
   * @param input.amountMinor Số tiền nạp theo minor unit.
   */
  prepareCheckoutAttempt: (
    input: StripeCheckoutAttemptInput,
  ) => Effect.Effect<
    { readonly attempt: PaymentAttemptRow },
    InvalidTopupRequest | PaymentAttemptUniqueViolation
  >;

  /**
   * Tạo payment attempt pending cho mobile PaymentSheet top-up.
   *
   * @param input Dữ liệu attempt top-up.
   * @param input.userId ID user nạp tiền.
   * @param input.walletId ID wallet nhận tiền.
   * @param input.amountMinor Số tiền nạp theo minor unit.
   */
  preparePaymentSheetAttempt: (
    input: StripeCheckoutAttemptInput,
  ) => Effect.Effect<
    { readonly attempt: PaymentAttemptRow },
    InvalidTopupRequest | PaymentAttemptUniqueViolation
  >;

  /**
   * Tạo Stripe Checkout Session cho payment attempt đã chuẩn bị.
   *
   * @param input Dữ liệu tạo Checkout Session.
   * @param input.attempt Payment attempt nội bộ.
   * @param input.successUrl URL redirect thành công.
   * @param input.cancelUrl URL redirect hủy checkout.
   */
  createCheckoutSession: (
    input: {
      readonly attempt: PaymentAttemptRow;
      readonly successUrl: string;
      readonly cancelUrl: string;
    },
  ) => Effect.Effect<{ readonly sessionId: string; readonly checkoutUrl: string }, TopupProviderError>;

  /**
   * Tạo Stripe PaymentIntent cho mobile PaymentSheet.
   *
   * @param input Dữ liệu tạo PaymentIntent.
   * @param input.attempt Payment attempt nội bộ.
   */
  createPaymentIntent: (
    input: {
      readonly attempt: PaymentAttemptRow;
    },
  ) => Effect.Effect<
    { readonly paymentIntentId: string; readonly clientSecret: string },
    TopupProviderError
  >;

  /**
   * Retrieve Checkout Session từ Stripe, expand PaymentIntent để reconciliation có đủ dữ liệu.
   *
   * @param sessionId ID Checkout Session từ Stripe.
   */
  retrieveCheckoutSession: (
    sessionId: string,
  ) => Effect.Effect<Stripe.Checkout.Session, TopupProviderError>;

  /**
   * Retrieve PaymentIntent từ Stripe cho reconciliation.
   *
   * @param paymentIntentId ID PaymentIntent từ Stripe.
   */
  retrievePaymentIntent: (
    paymentIntentId: string,
  ) => Effect.Effect<Stripe.PaymentIntent, TopupProviderError>;

  /**
   * Lưu Stripe provider ref vào payment attempt nội bộ.
   *
   * @param attemptId ID payment attempt nội bộ.
   * @param providerRef Stripe Checkout Session id hoặc PaymentIntent id.
   */
  attachProviderRef: (
    attemptId: string,
    providerRef: string,
  ) => Effect.Effect<PaymentAttemptRow, PaymentAttemptUniqueViolation>;

  /**
   * Resolve payment attempt từ Checkout Session webhook/retrieve response.
   *
   * @param session Checkout Session từ Stripe.
   */
  resolveAttemptForSession: (
    session: Stripe.Checkout.Session,
  ) => Effect.Effect<Option.Option<PaymentAttemptRow>>;

  /**
   * Resolve payment attempt từ PaymentIntent webhook/retrieve response.
   *
   * @param paymentIntent PaymentIntent từ Stripe.
   */
  resolveAttemptForPaymentIntent: (
    paymentIntent: Stripe.PaymentIntent,
  ) => Effect.Effect<Option.Option<PaymentAttemptRow>>;
};

export class StripeTopupServiceTag extends Context.Tag("StripeTopupService")<
  StripeTopupServiceTag,
  StripeTopupService
>() {}

/**
 * Kiểm tra amount top-up có hợp lệ để gửi sang Stripe hay không.
 *
 * @param amount Amount theo minor unit.
 */
function isValidMinorAmount(amount: number) {
  return Number.isInteger(amount) && amount > 0;
}

/**
 * Build metadata liên kết Stripe object với payment attempt nội bộ.
 *
 * @param attempt Payment attempt nội bộ.
 */
function buildAttemptMetadata(attempt: PaymentAttemptRow) {
  return {
    paymentAttemptId: attempt.id,
    userId: attempt.userId,
    walletId: attempt.walletId,
    kind: attempt.kind,
  };
}

/**
 * Layer live cho Stripe top-up provider adapter.
 *
 * @remarks Cần `StripeClient` và `PaymentAttemptRepository` trong environment.
 */
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

    const retrieveCheckoutSession: StripeTopupService["retrieveCheckoutSession"] = sessionId =>
      Effect.tryPromise({
        try: () =>
          stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["payment_intent"],
          }),
        catch: cause =>
          new TopupProviderError({
            operation: "stripe.checkout.sessions.retrieve",
            provider: "stripe",
            cause,
          }),
      });

    const retrievePaymentIntent: StripeTopupService["retrievePaymentIntent"] = paymentIntentId =>
      Effect.tryPromise({
        try: () => stripe.paymentIntents.retrieve(paymentIntentId),
        catch: cause =>
          new TopupProviderError({
            operation: "stripe.paymentIntents.retrieve",
            provider: "stripe",
            cause,
          }),
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
      retrieveCheckoutSession,
      retrievePaymentIntent,
      attachProviderRef,
      resolveAttemptForSession,
      resolveAttemptForPaymentIntent,
    };

    return service;
  }),
);
