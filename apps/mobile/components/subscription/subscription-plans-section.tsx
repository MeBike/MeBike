import React from "react";
import { StyleSheet, Text } from "react-native";

import type {
  SubscriptionListItem,
  SubscriptionPackage,
} from "@/types/subscription-types";

import type { SubscriptionPackageInfo } from "@constants/subscriptionPackages";
import { SubscriptionPackageCard } from "@components/subscription/subscription-package-card";

type Props = {
  packages: SubscriptionPackageInfo[];
  activeSubscription: SubscriptionListItem | null;
  pendingSubscription: SubscriptionListItem | null;
  canSubscribe: boolean;
  isLoading: (pkg: SubscriptionPackage) => boolean;
  onSubscribe: (pkg: SubscriptionPackage) => void;
};

export function SubscriptionPlansSection({
  packages,
  activeSubscription,
  pendingSubscription,
  canSubscribe,
  isLoading,
  onSubscribe,
}: Props) {
  return (
    <>
      <Text style={styles.title}>Chọn gói phù hợp</Text>
      {packages.map((pkg) => (
        <SubscriptionPackageCard
          key={pkg.id}
          info={pkg}
          disabled={!canSubscribe}
          isCurrent={pkg.id === activeSubscription?.package_name || pkg.id === pendingSubscription?.package_name}
          loading={isLoading(pkg.id)}
          onSubscribe={() => onSubscribe(pkg.id)}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginVertical: 12,
  },
});
