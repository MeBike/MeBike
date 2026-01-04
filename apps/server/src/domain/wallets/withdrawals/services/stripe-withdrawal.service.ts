import type Stripe from "stripe";

import { Context, Effect, Layer } from "effect";

import { StripeClient } from "@/infrastructure/stripe";

import { StripeConnectNotEnabled, WithdrawalProviderError } from "../domain-errors";

function getErrorMessage(cause: unknown): string | undefined {
  if (typeof cause === "object" && cause !== null && "message" in cause) {
    const message = (cause as { readonly message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

function isStripeConnectNotEnabledMessage(message: string | undefined): boolean {
  return typeof message === "string" && message.toLowerCase().includes("signed up for connect");
}

export type StripeConnectOnboardingResult = {
  readonly accountId: string;
  readonly url: string;
};

export type StripeWithdrawalService = {
  createConnectedAccount: (
    input: {
      readonly userId: string;
      readonly email: string;
    },
  ) => Effect.Effect<Stripe.Account, WithdrawalProviderError | StripeConnectNotEnabled>;
  createAccountLink: (
    input: {
      readonly accountId: string;
      readonly returnUrl: string;
      readonly refreshUrl: string;
    },
  ) => Effect.Effect<StripeConnectOnboardingResult, WithdrawalProviderError>;
  createTransfer: (
    input: {
      readonly amountMinor: number;
      readonly currency: string;
      readonly destinationAccountId: string;
      readonly idempotencyKey: string;
      readonly description?: string;
    },
  ) => Effect.Effect<Stripe.Transfer, WithdrawalProviderError>;
  createPayout: (
    input: {
      readonly amountMinor: number;
      readonly currency: string;
      readonly accountId: string;
      readonly idempotencyKey: string;
      readonly description?: string;
    },
  ) => Effect.Effect<Stripe.Payout, WithdrawalProviderError>;
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
            currency: input.currency,
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
            currency: input.currency,
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
