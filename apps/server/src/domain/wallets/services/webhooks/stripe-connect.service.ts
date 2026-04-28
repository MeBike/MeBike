import type Stripe from "stripe";

import { Effect, Match } from "effect";

import { UserCommandServiceTag } from "@/domain/users/services/user-command.live";
import { UserQueryServiceTag } from "@/domain/users/services/user-query.live";

import type {
  StripeConnectNotEnabled,
  WithdrawalProviderError,
} from "../../domain-errors";

import {
  InvalidWithdrawalRequest,
  WithdrawalUserNotFound,
} from "../../domain-errors";
import { StripeWithdrawalServiceTag } from "../providers/stripe-withdrawal.service";

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

/**
 * Bắt đầu onboarding Stripe Connect cho user muốn rút tiền.
 *
 * Flow này tạo connected account nếu user chưa có, lưu account id theo kiểu
 * compare-and-set để chịu được retry/race, rồi tạo account link onboarding.
 *
 * @param input Dữ liệu bắt đầu onboarding.
 * @param input.userId ID user cần onboarding.
 * @param input.returnUrl URL Stripe redirect sau khi onboarding xong.
 * @param input.refreshUrl URL Stripe redirect khi link hết hạn/cần refresh.
 */
export function startStripeConnectOnboardingUseCase(
  input: StartStripeConnectOnboardingInput,
): Effect.Effect<
  StartStripeConnectOnboardingResult,
  StripeConnectNotEnabled | WithdrawalProviderError | WithdrawalUserNotFound | InvalidWithdrawalRequest,
  StripeWithdrawalServiceTag | UserQueryServiceTag | UserCommandServiceTag
> {
  return Effect.gen(function* () {
    if (!input.returnUrl || !input.refreshUrl) {
      return yield* Effect.fail(new InvalidWithdrawalRequest({
        message: "returnUrl and refreshUrl are required to start Stripe onboarding.",
      }));
    }

    const userQueryService = yield* UserQueryServiceTag;
    const userCommandService = yield* UserCommandServiceTag;
    const stripeService = yield* StripeWithdrawalServiceTag;

    const userOpt = yield* userQueryService.getById(input.userId);
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

      const updatedOpt = yield* userCommandService.setStripeConnectedAccountIdIfNull(user.id, account.id);
      const updated = yield* Match.value(updatedOpt).pipe(
        Match.tag("Some", ({ value }) => Effect.succeed(value)),
        Match.tag("None", () => Effect.succeed(null)),
        Match.exhaustive,
      );

      if (updated?.stripeConnectedAccountId) {
        accountId = updated.stripeConnectedAccountId;
      }
      else {
        const racedUserOpt = yield* userQueryService.getById(user.id);
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

/**
 * Đồng bộ trạng thái payouts từ Stripe `account.updated` webhook về user.
 *
 * Đây là source cập nhật chính cho cờ `stripePayoutsEnabled` trước khi cho rút tiền.
 *
 * @param event Stripe account.updated event nhận từ HTTP boundary.
 */
export function handleStripeAccountUpdatedUseCase(
  event: Stripe.Event,
): Effect.Effect<
  StripeAccountUpdatedOutcome,
  never,
  UserCommandServiceTag
> {
  return Effect.gen(function* () {
    if (event.type !== "account.updated") {
      return { status: "ignored", reason: `unsupported_event:${event.type}` };
    }

    const account = event.data.object as Stripe.Account;
    const accountId = account.id;
    const payoutsEnabled = account.payouts_enabled === true;

    const userService = yield* UserCommandServiceTag;
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
