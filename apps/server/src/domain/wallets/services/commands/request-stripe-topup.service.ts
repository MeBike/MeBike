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

/**
 * Tạo Stripe Checkout Session cho flow nạp tiền vào wallet.
 *
 * Hàm này tạo payment attempt nội bộ trước, gọi Stripe để tạo session,
 * rồi attach provider ref để webhook/reconcile có thể settle về cùng attempt.
 *
 * @param input Dữ liệu tạo Checkout Session.
 * @param input.userId ID user cần nạp tiền.
 * @param input.amountMinor Số tiền nạp theo minor unit.
 * @param input.successUrl URL redirect khi Stripe checkout thành công.
 * @param input.cancelUrl URL redirect khi user hủy checkout.
 */
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

/**
 * Tạo Stripe PaymentIntent cho mobile PaymentSheet top-up.
 *
 * Flow này trả client secret cho mobile, còn settle tiền vẫn đi qua webhook
 * hoặc reconciliation để giữ idempotency ở server.
 *
 * @param input Dữ liệu tạo PaymentSheet top-up.
 * @param input.userId ID user cần nạp tiền.
 * @param input.amountMinor Số tiền nạp theo minor unit.
 */
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
