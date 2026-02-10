import type { SubscriptionPackage } from "generated/prisma/client";

export type SubscriptionPackageConfig = {
  readonly packageName: SubscriptionPackage;
  readonly price: bigint;
  readonly maxUsages: number | null;
  readonly currency: "usd";
};

const PACKAGE_CONFIG: Record<SubscriptionPackage, SubscriptionPackageConfig> = {
  basic: {
    packageName: "basic",
    price: 1190n,
    maxUsages: 30,
    currency: "usd",
  },
  premium: {
    packageName: "premium",
    price: 1990n,
    maxUsages: 60,
    currency: "usd",
  },
  unlimited: {
    packageName: "unlimited",
    price: 2990n,
    maxUsages: null,
    currency: "usd",
  },
};

export function getSubscriptionPackageConfig(
  packageName: SubscriptionPackage,
): SubscriptionPackageConfig {
  return PACKAGE_CONFIG[packageName];
}

export function listSubscriptionPackages(): SubscriptionPackageConfig[] {
  return Object.values(PACKAGE_CONFIG);
}
