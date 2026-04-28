import { Effect } from "effect";

import type { InvalidTopupRequest, PaymentAttemptUniqueViolation, TopupProviderError, WalletNotFound } from "../../domain-errors";
import type {
  StripeCheckoutAttemptInput,
  StripeTopupPaymentSheetResult,
  StripeTopupSessionResult,
} from "../providers/stripe-topup.service";

import { StripeTopupServiceTag } from "../providers/stripe-topup.service";
import { WalletQueryServiceTag } from "../queries/wallet-query.service";

export type CreateStripeCheckoutSessionInput = Omit<
  StripeCheckoutAttemptInput,
  "walletId"
> & {
  readonly successUrl: string;
  readonly cancelUrl: string;
};

export type CreateStripePaymentSheetInput = Omit<
  StripeCheckoutAttemptInput,
  "walletId"
>;

export function createStripeCheckoutSession(
  input: CreateStripeCheckoutSessionInput,
): Effect.Effect<
  StripeTopupSessionResult,
  InvalidTopupRequest | TopupProviderError | PaymentAttemptUniqueViolation | WalletNotFound,
  StripeTopupServiceTag | WalletQueryServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* StripeTopupServiceTag;
    const walletService = yield* WalletQueryServiceTag;
    const wallet = yield* walletService.getByUserId(input.userId);

    const prepared = yield* service.prepareCheckoutAttempt({
      userId: input.userId,
      walletId: wallet.id,
      amountMinor: input.amountMinor,
    });

    const session = yield* service.createCheckoutSession({
      attempt: prepared.attempt,
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

export function createStripePaymentSheet(
  input: CreateStripePaymentSheetInput,
): Effect.Effect<
  StripeTopupPaymentSheetResult,
  InvalidTopupRequest | TopupProviderError | PaymentAttemptUniqueViolation | WalletNotFound,
  StripeTopupServiceTag | WalletQueryServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* StripeTopupServiceTag;
    const walletService = yield* WalletQueryServiceTag;
    const wallet = yield* walletService.getByUserId(input.userId);

    const prepared = yield* service.preparePaymentSheetAttempt({
      userId: input.userId,
      walletId: wallet.id,
      amountMinor: input.amountMinor,
    });

    const paymentIntent = yield* service.createPaymentIntent({
      attempt: prepared.attempt,
    });

    yield* service.attachProviderRef(prepared.attempt.id, paymentIntent.paymentIntentId);

    return {
      paymentAttemptId: prepared.attempt.id,
      paymentIntentClientSecret: paymentIntent.clientSecret,
    };
  });
}
