import type Stripe from "stripe";

import { Effect, Match } from "effect";

import type { UserRepositoryError } from "@/domain/users/domain-errors";

import { UserServiceTag } from "@/domain/users/services/user.service";

import type {
  StripeConnectNotEnabled,
  WithdrawalProviderError,
} from "../domain-errors";

import {
  InvalidWithdrawalRequest,
  WithdrawalUserNotFound,
} from "../domain-errors";
import { StripeWithdrawalServiceTag } from "../services/stripe-withdrawal.service";

export type StartStripeConnectOnboardingInput = {
  readonly userId: string;
  readonly returnUrl: string;
  readonly refreshUrl: string;
};

export type StartStripeConnectOnboardingResult = {
  readonly accountId: string;
  readonly onboardingUrl: string;
};

export type StripeAccountUpdatedOutcome
  = | { readonly status: "ignored"; readonly reason: string }
    | { readonly status: "missing"; readonly accountId: string }
    | { readonly status: "updated"; readonly accountId: string; readonly payoutsEnabled: boolean };

export function startStripeConnectOnboardingUseCase(
  input: StartStripeConnectOnboardingInput,
): Effect.Effect<
  StartStripeConnectOnboardingResult,
  StripeConnectNotEnabled | WithdrawalProviderError | WithdrawalUserNotFound | InvalidWithdrawalRequest
  | UserRepositoryError,
  StripeWithdrawalServiceTag | UserServiceTag
> {
  return Effect.gen(function* () {
    if (!input.returnUrl || !input.refreshUrl) {
      return yield* Effect.fail(new InvalidWithdrawalRequest({
        message: "returnUrl and refreshUrl are required to start Stripe onboarding.",
      }));
    }

    const userService = yield* UserServiceTag;
    const stripeService = yield* StripeWithdrawalServiceTag;

    const userOpt = yield* userService.getById(input.userId);
    const user = yield* Match.value(userOpt).pipe(
      Match.tag("Some", ({ value }) => Effect.succeed(value)),
      Match.tag("None", () => Effect.fail(new WithdrawalUserNotFound({ userId: input.userId }))),
      Match.exhaustive,
    );

    let accountId = user.stripeConnectedAccountId ?? null;
    if (!accountId) {
      const account = yield* stripeService.createConnectedAccount({
        userId: user.id,
        email: user.email,
      });

      const updatedOpt = yield* userService.setStripeConnectedAccountIdIfNull(user.id, account.id);
      const updated = yield* Match.value(updatedOpt).pipe(
        Match.tag("Some", ({ value }) => Effect.succeed(value)),
        Match.tag("None", () => Effect.succeed(null)),
        Match.exhaustive,
      );

      if (updated?.stripeConnectedAccountId) {
        accountId = updated.stripeConnectedAccountId;
      }
      else {
        const racedUserOpt = yield* userService.getById(user.id);
        const racedUser = yield* Match.value(racedUserOpt).pipe(
          Match.tag("Some", ({ value }) => Effect.succeed(value)),
          Match.tag("None", () => Effect.fail(new WithdrawalUserNotFound({ userId: user.id }))),
          Match.exhaustive,
        );
        accountId = racedUser.stripeConnectedAccountId ?? null;
      }
    }

    if (!accountId) {
      return yield* Effect.fail(new WithdrawalUserNotFound({ userId: user.id }));
    }

    const link = yield* stripeService.createAccountLink({
      accountId,
      returnUrl: input.returnUrl,
      refreshUrl: input.refreshUrl,
    });

    return {
      accountId: link.accountId,
      onboardingUrl: link.url,
    };
  });
}

export function handleStripeAccountUpdatedUseCase(
  event: Stripe.Event,
): Effect.Effect<
  StripeAccountUpdatedOutcome,
  UserRepositoryError,
  UserServiceTag
> {
  return Effect.gen(function* () {
    if (event.type !== "account.updated") {
      return { status: "ignored", reason: `unsupported_event:${event.type}` };
    }

    const account = event.data.object as Stripe.Account;
    const accountId = account.id;
    const payoutsEnabled = account.payouts_enabled === true;

    const userService = yield* UserServiceTag;
    const updated = yield* userService.setStripePayoutsEnabledByAccountId(
      accountId,
      payoutsEnabled,
    );

    if (!updated) {
      return { status: "missing", accountId };
    }

    return { status: "updated", accountId, payoutsEnabled };
  });
}
