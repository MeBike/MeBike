import type Stripe from "stripe";

import { Effect, Match } from "effect";

import type {
  InsufficientWalletBalance,
  WalletNotFound,
} from "@/domain/wallets/domain-errors";
import type { TopupProviderError } from "@/domain/wallets/topups/domain-errors";
import type { StripeWebhookOutcome as StripeTopupOutcome } from "@/domain/wallets/topups/services/stripe-topup.service";
import type { StripeAccountUpdatedOutcome } from "@/domain/wallets/withdrawals/services/stripe-connect.service";
import type { StripePayoutOutcome } from "@/domain/wallets/withdrawals/services/stripe-payout.service";

import {
  handleStripePaymentIntentWebhookEventUseCase,
  handleStripeTopupWebhookEventUseCase,
} from "@/domain/wallets/topups";
import { handleStripeAccountUpdatedUseCase } from "@/domain/wallets/withdrawals/services/stripe-connect.service";
import { handleStripePayoutWebhookUseCase } from "@/domain/wallets/withdrawals/services/stripe-payout.service";

export type StripeWebhookDispatchOutcome
  = | StripeTopupOutcome
    | StripeAccountUpdatedOutcome
    | StripePayoutOutcome;

export function handleStripeWebhookUseCase(
  event: Stripe.Event,
): Effect.Effect<
  StripeWebhookDispatchOutcome,
  | TopupProviderError
  | WalletNotFound
  | InsufficientWalletBalance,
  | import("@/domain/wallets/topups/services/stripe-topup.service").StripeTopupServiceTag
  | import("@/domain/wallets/withdrawals/repository/withdrawal.repository").WithdrawalRepository
  | import("@/domain/users/services/user-command.live").UserCommandServiceTag
  | import("@/infrastructure/prisma").Prisma
> {
  return Match.value(event.type).pipe(
    Match.when(
      type => type === "account.updated",
      () => handleStripeAccountUpdatedUseCase(event),
    ),
    Match.when(
      type => type.startsWith("payout."),
      () => handleStripePayoutWebhookUseCase(event),
    ),
    Match.when(
      type => type === "checkout.session.completed",
      () => handleStripeTopupWebhookEventUseCase(event),
    ),
    Match.when(
      type => type === "payment_intent.succeeded" || type === "payment_intent.payment_failed",
      () => handleStripePaymentIntentWebhookEventUseCase(event),
    ),
    Match.orElse(() => Effect.succeed({
      status: "ignored",
      reason: `unsupported_event:${event.type}`,
    } as StripeWebhookDispatchOutcome)),
  );
}
