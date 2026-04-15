import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { AdminSubscriptionRow, SubscriptionRow } from "../models";

/**
 * Projection chuẩn cho subscription row thuần.
 * Tất cả query thường của domain nên dùng chung projection này để tránh lệch shape.
 */
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

/**
 * Projection dành cho admin, mở rộng thêm owner summary.
 */
export const selectAdminSubscriptionRow = {
  ...selectSubscriptionRow,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} as const satisfies PrismaTypes.SubscriptionSelect;

/**
 * Chuẩn hóa payload Prisma thành `SubscriptionRow` của domain.
 */
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

/**
 * Chuẩn hóa payload Prisma có join user thành `AdminSubscriptionRow`.
 */
export function toAdminSubscriptionRow(
  row: PrismaTypes.SubscriptionGetPayload<{ select: typeof selectAdminSubscriptionRow }>,
): AdminSubscriptionRow {
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
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
      email: row.user.email,
    },
  };
}
