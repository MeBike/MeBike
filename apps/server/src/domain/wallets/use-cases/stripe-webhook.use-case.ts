import type Stripe from "stripe";

import { Effect, Match } from "effect";

import type { UserRepositoryError } from "@/domain/users/domain-errors";
import type {
  InsufficientWalletBalance,
  WalletHoldRepositoryError,
  WalletNotFound,
  WalletRepositoryError,
} from "@/domain/wallets/domain-errors";
import type { PaymentAttemptRepositoryError, TopupProviderError } from "@/domain/wallets/topups/domain-errors";
import type { StripeWebhookOutcome as StripeTopupOutcome } from "@/domain/wallets/topups/services/stripe-topup.service";
import type { WithdrawalRepositoryError } from "@/domain/wallets/withdrawals/domain-errors";
import type { StripeAccountUpdatedOutcome } from "@/domain/wallets/withdrawals/use-cases/stripe-connect.use-cases";
import type { StripePayoutOutcome } from "@/domain/wallets/withdrawals/use-cases/stripe-payout.use-cases";

import { handleStripeTopupWebhookEventUseCase } from "@/domain/wallets/topups";
import { handleStripeAccountUpdatedUseCase } from "@/domain/wallets/withdrawals/use-cases/stripe-connect.use-cases";
import { handleStripePayoutWebhookUseCase } from "@/domain/wallets/withdrawals/use-cases/stripe-payout.use-cases";

export type StripeWebhookDispatchOutcome
  = | StripeTopupOutcome
    | StripeAccountUpdatedOutcome
    | StripePayoutOutcome;

export function handleStripeWebhookUseCase(
  event: Stripe.Event,
): Effect.Effect<
  StripeWebhookDispatchOutcome,
  | TopupProviderError
  | PaymentAttemptRepositoryError
  | WithdrawalRepositoryError
  | WalletHoldRepositoryError
  | WalletNotFound
  | WalletRepositoryError
  | InsufficientWalletBalance
  | UserRepositoryError,
  | import("@/domain/wallets/topups/services/stripe-topup.service").StripeTopupServiceTag
  | import("@/domain/wallets/withdrawals/repository/withdrawal.repository").WithdrawalRepository
  | import("@/domain/users/services/user.service").UserServiceTag
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
    Match.orElse(() => Effect.succeed({
      status: "ignored",
      reason: `unsupported_event:${event.type}`,
    } as StripeWebhookDispatchOutcome)),
  );
}
