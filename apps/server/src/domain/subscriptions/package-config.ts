import type { SubscriptionPackage } from "generated/prisma/client";

/**
 * Cấu hình runtime cho từng gói subscription.
 * Giá và số lượt hiện được giữ cứng trong code vì chưa có yêu cầu quản trị động.
 */
export type SubscriptionPackageConfig = {
  readonly packageName: SubscriptionPackage;
  readonly price: bigint;
  readonly maxUsages: number | null;
  readonly currency: "vnd";
};

const PACKAGE_CONFIG: Record<SubscriptionPackage, SubscriptionPackageConfig> = {
  basic: {
    packageName: "basic",
    price: 119000n,
    maxUsages: 30,
    currency: "vnd",
  },
  premium: {
    packageName: "premium",
    price: 199000n,
    maxUsages: 60,
    currency: "vnd",
  },
  ultra: {
    packageName: "ultra",
    price: 299000n,
    maxUsages: 90,
    currency: "vnd",
  },
};

/**
 * Lấy cấu hình của một package cụ thể.
 */
export function getSubscriptionPackageConfig(
  packageName: SubscriptionPackage,
): SubscriptionPackageConfig {
  return PACKAGE_CONFIG[packageName];
}

/**
 * Trả về toàn bộ package đang được hỗ trợ.
 */
export function listSubscriptionPackages(): SubscriptionPackageConfig[] {
  return Object.values(PACKAGE_CONFIG);
}
