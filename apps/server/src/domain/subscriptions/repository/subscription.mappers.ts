import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { SubscriptionRow } from "../models";

export const selectSubscriptionRow = {
  id: true,
  userId: true,
  packageName: true,
  maxUsages: true,
  usageCount: true,
  status: true,
  activatedAt: true,
  expiresAt: true,
  price: true,
  updatedAt: true,
} as const satisfies PrismaTypes.SubscriptionSelect;

export function toSubscriptionRow(
  row: PrismaTypes.SubscriptionGetPayload<{ select: typeof selectSubscriptionRow }>,
): SubscriptionRow {
  return {
    id: row.id,
    userId: row.userId,
    packageName: row.packageName,
    maxUsages: row.maxUsages,
    usageCount: row.usageCount,
    status: row.status,
    activatedAt: row.activatedAt,
    expiresAt: row.expiresAt,
    price: row.price,
    updatedAt: row.updatedAt,
  };
}
