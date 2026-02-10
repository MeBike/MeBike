import { Effect, Option } from "effect";

import type { SubscriptionRow } from "../models";
import type { ActivateSubscriptionFailure } from "./subscription-flows.shared";

import {
  SubscriptionNotFound as SubscriptionNotFoundError,
  SubscriptionNotPending as SubscriptionNotPendingError,
} from "../domain-errors";
import { SubscriptionServiceTag } from "../services/subscription.service";
import { computeExpiresAt } from "./subscription-flows.shared";

export function activateSubscriptionUseCase(args: {
  subscriptionId: string;
  now?: Date;
}): Effect.Effect<
  SubscriptionRow,
  ActivateSubscriptionFailure,
  SubscriptionServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* SubscriptionServiceTag;
    const now = args.now ?? new Date();

    const subOpt = yield* service.findById(args.subscriptionId);
    if (Option.isNone(subOpt)) {
      return yield* Effect.fail(
        new SubscriptionNotFoundError({ subscriptionId: args.subscriptionId }),
      );
    }

    const sub = subOpt.value;

    if (sub.status !== "PENDING") {
      return yield* Effect.fail(
        new SubscriptionNotPendingError({ subscriptionId: sub.id }),
      );
    }

    const activated = yield* service.activate({
      subscriptionId: sub.id,
      activatedAt: now,
      expiresAt: computeExpiresAt(now),
    });

    return activated;
  });
}
