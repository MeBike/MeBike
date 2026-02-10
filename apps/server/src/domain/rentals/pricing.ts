import { Effect } from "effect";

import { env } from "@/config/env";
import { SubscriptionNotUsable } from "@/domain/subscriptions/domain-errors";

export type SubscriptionCoverageInput = {
  readonly durationMinutes: number;
  readonly subscription: {
    readonly id: string;
    readonly userId: string;
    readonly status: string;
    readonly maxUsages: number | null;
    readonly usageCount: number;
  };
  readonly userId: string;
};

export type SubscriptionCoverageResult = {
  readonly basePrice: number;
  readonly usageToAdd: number;
};

export function computeSubscriptionCoverage({
  durationMinutes,
  subscription,
  userId,
}: SubscriptionCoverageInput): Effect.Effect<
  SubscriptionCoverageResult,
  SubscriptionNotUsable
> {
  return Effect.gen(function* () {
    if (subscription.userId !== userId) {
      return yield* Effect.fail(new SubscriptionNotUsable({
        subscriptionId: subscription.id,
        status: subscription.status,
      }));
    }

    if (subscription.status !== "ACTIVE" && subscription.status !== "PENDING") {
      return yield* Effect.fail(new SubscriptionNotUsable({
        subscriptionId: subscription.id,
        status: subscription.status,
      }));
    }

    const durationHours = durationMinutes / 60;
    const requiredUsages = Math.max(
      1,
      Math.ceil(durationHours / env.SUB_HOURS_PER_USED),
    );

    if (subscription.maxUsages === null) {
      return {
        basePrice: 0,
        usageToAdd: Math.max(0, requiredUsages - 1),
      };
    }

    const availableUsages = Math.max(
      0,
      subscription.maxUsages - subscription.usageCount + 1,
    );
    const coverMinutes = Math.max(
      0,
      availableUsages * env.SUB_HOURS_PER_USED * 60,
    );
    const extraMinutes = Math.max(0, durationMinutes - coverMinutes);
    const basePrice = extraMinutes > 0
      ? Math.ceil(extraMinutes / 30) * env.PRICE_PER_30_MINS
      : 0;
    const usageToAdd = Math.max(
      0,
      Math.min(availableUsages - 1, requiredUsages - 1),
    );

    return { basePrice, usageToAdd };
  });
}
