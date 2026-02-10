import type { SubscriptionPackage, SubscriptionStatus } from "generated/prisma/client";

export type SubscriptionRow = {
  readonly id: string;
  readonly userId: string;
  readonly packageName: SubscriptionPackage;
  readonly maxUsages: number | null;
  readonly usageCount: number;
  readonly status: SubscriptionStatus;
  readonly activatedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly price: bigint;
  readonly updatedAt: Date;
};

export type SubscriptionSortField
  = | "updatedAt"
    | "expiresAt"
    | "status"
    | "activatedAt"
    | "packageName";

export type SubscriptionFilter = {
  readonly status?: SubscriptionStatus;
};
