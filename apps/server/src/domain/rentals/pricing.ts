import { Effect } from "effect";

import type { PricingPolicyRow } from "@/domain/pricing";

import { env } from "@/config/env";
import { calculateUsageChargeMinor } from "@/domain/pricing";
import { SubscriptionNotUsable } from "@/domain/subscriptions/domain-errors";

export type SubscriptionCoverageInput = {
  readonly durationMinutes: number;
  readonly pricingPolicy: PricingPolicyRow;
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
  readonly basePriceMinor: bigint;
  readonly subscriptionDiscountMinor: bigint;
  readonly usageToAdd: number;
};

export function computeSubscriptionCoverage({
  durationMinutes,
  pricingPolicy,
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
        basePriceMinor: 0n,
        subscriptionDiscountMinor: calculateUsageChargeMinor({
          durationMinutes,
          policy: pricingPolicy,
        }),
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
    const fullAmountMinor = calculateUsageChargeMinor({
      durationMinutes,
      policy: pricingPolicy,
    });
    const basePriceMinor = extraMinutes > 0
      ? calculateUsageChargeMinor({
          durationMinutes: extraMinutes,
          policy: pricingPolicy,
        })
      : 0n;
    const usageToAdd = Math.max(
      0,
      Math.min(availableUsages - 1, requiredUsages - 1),
    );

    return {
      basePriceMinor,
      subscriptionDiscountMinor: fullAmountMinor - basePriceMinor,
      usageToAdd,
    };
  });
}
