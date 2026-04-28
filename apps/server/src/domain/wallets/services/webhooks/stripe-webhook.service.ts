import type Stripe from "stripe";

import { Effect, Match } from "effect";

import type {
  InsufficientWalletBalance,
  TopupProviderError,
  WalletNotFound,
} from "@/domain/wallets/domain-errors";
import type { StripeWebhookOutcome as StripeTopupOutcome } from "@/domain/wallets/services/providers/stripe-topup.service";
import type { StripeAccountUpdatedOutcome } from "@/domain/wallets/services/webhooks/stripe-connect.service";
import type { StripePayoutOutcome } from "@/domain/wallets/services/webhooks/stripe-payout.service";

import { handleStripeAccountUpdatedUseCase } from "@/domain/wallets/services/webhooks/stripe-connect.service";
import { handleStripePayoutWebhookUseCase } from "@/domain/wallets/services/webhooks/stripe-payout.service";
import { handleStripePaymentIntentWebhookEvent, handleStripeTopupWebhookEvent } from "@/domain/wallets/services/webhooks/stripe-topup-webhook.service";

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
  | import("@/domain/wallets/services/providers/stripe-topup.service").StripeTopupServiceTag
  | import("@/domain/wallets/repository/withdrawal.repository").WithdrawalRepository
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
      () => handleStripeTopupWebhookEvent(event),
    ),
    Match.when(
      type => type === "payment_intent.succeeded" || type === "payment_intent.payment_failed",
      () => handleStripePaymentIntentWebhookEvent(event),
    ),
    Match.orElse(() => Effect.succeed({
      status: "ignored",
      reason: `unsupported_event:${event.type}`,
    } as StripeWebhookDispatchOutcome)),
  );
}
