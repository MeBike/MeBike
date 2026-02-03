import { Effect, Option } from "effect";

import type { SubscriptionRow } from "../models";
import type { UseSubscriptionFailure } from "./subscription-flows.shared";

import {
  SubscriptionExpired as SubscriptionExpiredError,
  SubscriptionNotFound as SubscriptionNotFoundError,
  SubscriptionNotUsable as SubscriptionNotUsableError,
  SubscriptionUsageExceeded as SubscriptionUsageExceededError,
} from "../domain-errors";
import { SubscriptionServiceTag } from "../services/subscription.service";
import { computeExpiresAt } from "./subscription-flows.shared";

export function useSubscriptionOnceUseCase(args: {
  subscriptionId: string;
  userId: string;
  now?: Date;
}): Effect.Effect<SubscriptionRow, UseSubscriptionFailure, SubscriptionServiceTag> {
  return Effect.gen(function* () {
    const service = yield* SubscriptionServiceTag;
    const now = args.now ?? new Date();
    // TODO: add a small bounded retry when incrementUsage CAS fails due to concurrent usage.

    const subOpt = yield* service.findById(args.subscriptionId);
    if (Option.isNone(subOpt)) {
      return yield* Effect.fail(
        new SubscriptionNotFoundError({ subscriptionId: args.subscriptionId }),
      );
    }

    const sub = subOpt.value;

    if (sub.userId !== args.userId) {
      return yield* Effect.fail(
        new SubscriptionNotUsableError({
          subscriptionId: sub.id,
          status: sub.status,
        }),
      );
    }

    if (sub.status === "CANCELLED" || sub.status === "EXPIRED") {
      return yield* Effect.fail(
        new SubscriptionNotUsableError({
          subscriptionId: sub.id,
          status: sub.status,
        }),
      );
    }

    if (sub.expiresAt && sub.expiresAt <= now) {
      return yield* Effect.fail(
        new SubscriptionExpiredError({ subscriptionId: sub.id }),
      );
    }

    if (sub.maxUsages !== null && sub.usageCount >= sub.maxUsages) {
      return yield* Effect.fail(
        new SubscriptionUsageExceededError({
          subscriptionId: sub.id,
          usageCount: sub.usageCount,
          maxUsages: sub.maxUsages,
        }),
      );
    }

    const maybeActivated = sub.status === "PENDING"
      ? yield* service.activate({
        subscriptionId: sub.id,
        activatedAt: now,
        expiresAt: computeExpiresAt(now),
      }).pipe(
        Effect.catchTag(
          "SubscriptionNotPending",
          err =>
            Effect.fail(new SubscriptionNotUsableError({
              subscriptionId: err.subscriptionId,
              status: "PENDING",
            })),
        ),
      )
      : sub;

    const incremented = yield* service.incrementUsage(
      maybeActivated.id,
      maybeActivated.usageCount,
      1,
    );

    return incremented;
  });
}
