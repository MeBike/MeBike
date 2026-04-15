import type { SubscriptionsContracts } from "@mebike/shared";

import type { AdminSubscriptionRow, SubscriptionRow } from "@/domain/subscriptions";
import type { SubscriptionPackageConfig } from "@/domain/subscriptions/package-config";

export function toSubscriptionDetail(
  row: SubscriptionRow,
): SubscriptionsContracts.SubscriptionDetail {
  return {
    id: row.id,
    userId: row.userId,
    packageName: row.packageName,
    maxUsages: row.maxUsages,
    usageCount: row.usageCount,
    status: row.status,
    activatedAt: row.activatedAt ? row.activatedAt.toISOString() : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    price: row.price.toString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toSubscriptionPackageDetail(
  pkg: SubscriptionPackageConfig,
): SubscriptionsContracts.SubscriptionPackageDetail {
  return {
    packageName: pkg.packageName,
    price: pkg.price.toString(),
    maxUsages: pkg.maxUsages,
    currency: pkg.currency,
  };
}

export function toAdminSubscriptionDetail(
  row: AdminSubscriptionRow,
): SubscriptionsContracts.AdminSubscriptionDetail {
  return {
    ...toSubscriptionDetail(row),
    user: row.user,
  };
}
