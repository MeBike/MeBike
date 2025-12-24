import type { Prisma as PrismaTypes } from "generated/prisma/client";
import type { SubscriptionPackage, SubscriptionStatus } from "generated/prisma/types";

export type SubscriptionDecimal = PrismaTypes.Decimal;

export type SubscriptionRow = {
  readonly id: string;
  readonly userId: string;
  readonly packageName: SubscriptionPackage;
  readonly maxUsages: number | null;
  readonly usageCount: number;
  readonly status: SubscriptionStatus;
  readonly activatedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly price: SubscriptionDecimal;
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
