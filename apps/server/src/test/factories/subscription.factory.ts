import { uuidv7 } from "uuidv7";

import type { CreatedSubscription, FactoryContext, SubscriptionOverrides } from "./types";

const defaults = {
  packageName: "basic" as const,
  maxUsages: 30,
  usageCount: 0,
  status: "ACTIVE" as const,
  activatedAt: () => new Date(),
  expiresAt: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  price: 10000n,
};

export function createSubscriptionFactory(ctx: FactoryContext) {
  return async (overrides: SubscriptionOverrides): Promise<CreatedSubscription> => {
    const id = overrides.id ?? uuidv7();

    if (!overrides.userId) {
      throw new Error("userId is required for createSubscription");
    }

    const status = overrides.status ?? defaults.status;

    await ctx.prisma.subscription.create({
      data: {
        id,
        userId: overrides.userId,
        packageName: overrides.packageName ?? defaults.packageName,
        maxUsages: overrides.maxUsages ?? defaults.maxUsages,
        usageCount: overrides.usageCount ?? defaults.usageCount,
        status,
        activatedAt: overrides.activatedAt ?? (status === "ACTIVE" ? defaults.activatedAt() : null),
        expiresAt: overrides.expiresAt ?? (status === "ACTIVE" ? defaults.expiresAt() : null),
        price: overrides.price ?? defaults.price,
      },
    });

    return { id, userId: overrides.userId };
  };
}

export type SubscriptionFactory = ReturnType<typeof createSubscriptionFactory>;
