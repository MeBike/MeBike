import type Stripe from "stripe";

import { Context, Effect, Layer } from "effect";

import { StripeClient } from "@/infrastructure/stripe";

import { StripeConnectNotEnabled, WithdrawalProviderError } from "../../domain-errors";

/**
 * Lấy message từ lỗi Stripe SDK dạng unknown.
 *
 * @param cause Lỗi thô từ provider.
 */
function getErrorMessage(cause: unknown): string | undefined {
  if (typeof cause === "object" && cause !== null && "message" in cause) {
    const message = (cause as { readonly message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

/**
 * Nhận diện lỗi Stripe account chưa bật Connect trên account platform.
 *
 * @param message Message lỗi từ Stripe SDK.
 */
function isStripeConnectNotEnabledMessage(message: string | undefined): boolean {
  return typeof message === "string" && message.toLowerCase().includes("signed up for connect");
}

export type StripeConnectOnboardingResult = {
  readonly accountId: string;
  readonly url: string;
};

/**
 * Provider adapter cho Stripe Connect withdrawal.
 *
 * Service này đóng gói toàn bộ calls sang Stripe cho onboarding, transfer, payout và retrieve payout.
 */
export type StripeWithdrawalService = {
  /**
   * Tạo Stripe Express connected account cho user.
   *
   * @param input Dữ liệu tạo connected account.
   * @param input.userId ID user nội bộ.
   * @param input.email Email user dùng cho Stripe account.
   */
  createConnectedAccount: (
    input: {
      readonly userId: string;
      readonly email: string;
    },
  ) => Effect.Effect<Stripe.Account, WithdrawalProviderError | StripeConnectNotEnabled>;

  /**
   * Tạo onboarding account link cho connected account.
   *
   * @param input Dữ liệu tạo account link.
   * @param input.accountId Stripe connected account id.
   * @param input.returnUrl URL quay lại app sau onboarding.
   * @param input.refreshUrl URL refresh khi account link hết hạn.
   */
  createAccountLink: (
    input: {
      readonly accountId: string;
      readonly returnUrl: string;
      readonly refreshUrl: string;
    },
  ) => Effect.Effect<StripeConnectOnboardingResult, WithdrawalProviderError>;

  /**
   * Tạo transfer từ platform balance sang connected account.
   *
   * @param input Dữ liệu tạo transfer.
   * @param input.amountMinor Amount USD theo minor unit.
   * @param input.destinationAccountId Stripe connected account id.
   * @param input.idempotencyKey Khóa idempotency cho transfer.
   * @param input.description Mô tả transfer.
   */
  createTransfer: (
    input: {
      readonly amountMinor: number;
      readonly destinationAccountId: string;
      readonly idempotencyKey: string;
      readonly description?: string;
    },
  ) => Effect.Effect<Stripe.Transfer, WithdrawalProviderError>;

  /**
   * Tạo payout từ connected account ra external account của user.
   *
   * @param input Dữ liệu tạo payout.
   * @param input.amountMinor Amount USD theo minor unit.
   * @param input.accountId Stripe connected account id.
   * @param input.idempotencyKey Khóa idempotency cho payout.
   * @param input.description Mô tả payout.
   */
  createPayout: (
    input: {
      readonly amountMinor: number;
      readonly accountId: string;
      readonly idempotencyKey: string;
      readonly description?: string;
    },
  ) => Effect.Effect<Stripe.Payout, WithdrawalProviderError>;

  /**
   * Retrieve payout từ Stripe connected account để reconcile withdrawal.
   *
   * @param input Dữ liệu retrieve payout.
   * @param input.payoutId Stripe payout id.
   * @param input.accountId Stripe connected account id.
   */
  retrievePayout: (
    input: {
      readonly payoutId: string;
      readonly accountId: string;
    },
  ) => Effect.Effect<Stripe.Payout, WithdrawalProviderError>;
};

export class StripeWithdrawalServiceTag extends Context.Tag("StripeWithdrawalService")<
  StripeWithdrawalServiceTag,
  StripeWithdrawalService
>() {}

/**
 * Layer live cho Stripe withdrawal provider adapter.
 *
 * @remarks Cần `StripeClient` trong environment.
 */
export const StripeWithdrawalServiceLive = Layer.effect(
  StripeWithdrawalServiceTag,
  Effect.gen(function* () {
    const stripe = (yield* StripeClient).client;

    const createConnectedAccount: StripeWithdrawalService["createConnectedAccount"] = input =>
      Effect.tryPromise({
        try: () =>
          stripe.accounts.create({
            type: "express",
            email: input.email,
            metadata: { userId: input.userId },
          }, { idempotencyKey: `connect-account:${input.userId}` }),
        catch: (cause) => {
          const message = getErrorMessage(cause);
          if (isStripeConnectNotEnabledMessage(message)) {
            return new StripeConnectNotEnabled({
              operation: "stripe.accounts.create",
              provider: "stripe",
              cause,
            });
          }
          return new WithdrawalProviderError({
            operation: "stripe.accounts.create",
            provider: "stripe",
            cause,
          });
        },
      });

    const createAccountLink: StripeWithdrawalService["createAccountLink"] = input =>
      Effect.tryPromise({
        try: () =>
          stripe.accountLinks.create({
            account: input.accountId,
            type: "account_onboarding",
            return_url: input.returnUrl,
            refresh_url: input.refreshUrl,
          }),
        catch: cause =>
          new WithdrawalProviderError({
            operation: "stripe.accountLinks.create",
            provider: "stripe",
            cause,
          }),
      }).pipe(
        Effect.map(link => ({
          accountId: input.accountId,
          url: link.url,
        })),
      );

    const createTransfer: StripeWithdrawalService["createTransfer"] = input =>
      Effect.tryPromise({
        try: () =>
          stripe.transfers.create({
            amount: input.amountMinor,
            currency: "usd",
            destination: input.destinationAccountId,
            description: input.description,
          }, { idempotencyKey: input.idempotencyKey }),
        catch: cause =>
          new WithdrawalProviderError({
            operation: "stripe.transfers.create",
            provider: "stripe",
            cause,
          }),
      });

    const createPayout: StripeWithdrawalService["createPayout"] = input =>
      Effect.tryPromise({
        try: () =>
          stripe.payouts.create({
            amount: input.amountMinor,
            currency: "usd",
            description: input.description,
          }, { stripeAccount: input.accountId, idempotencyKey: input.idempotencyKey }),
        catch: cause =>
          new WithdrawalProviderError({
            operation: "stripe.payouts.create",
            provider: "stripe",
            cause,
          }),
      });

    const retrievePayout: StripeWithdrawalService["retrievePayout"] = input =>
      Effect.tryPromise({
        try: () =>
          stripe.payouts.retrieve(
            input.payoutId,
            undefined,
            { stripeAccount: input.accountId },
          ),
        catch: cause =>
          new WithdrawalProviderError({
            operation: "stripe.payouts.retrieve",
            provider: "stripe",
            cause,
          }),
      });

    const service: StripeWithdrawalService = {
      createConnectedAccount,
      createAccountLink,
      createTransfer,
      createPayout,
      retrievePayout,
    };

    return service;
  }),
);
