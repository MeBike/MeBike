import type { SubscriptionPackageInfo } from "@constants/subscriptionPackages";

import { SubscriptionPackageCard } from "@components/subscription/subscription-package-card";
import React from "react";
import { StyleSheet, Text } from "react-native";

import type {
  SubscriptionListItem,
  SubscriptionPackage,
} from "@/types/subscription-types";

type Props = {
  packages: SubscriptionPackageInfo[];
  activeSubscription: SubscriptionListItem | null;
  pendingSubscription: SubscriptionListItem | null;
  canSubscribe: boolean;
  subscribingPackage: SubscriptionPackage | null;
  onSubscribe: (pkg: SubscriptionPackage) => void;
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginVertical: 12,
  },
});

export function SubscriptionPlansList({
  packages,
  activeSubscription,
  pendingSubscription,
  canSubscribe,
  subscribingPackage,
  onSubscribe,
}: Props) {
  return (
    <>
      <Text style={styles.title}>Chọn gói phù hợp</Text>
      {packages.map(pkg => (
        <SubscriptionPackageCard
          key={pkg.id}
          info={pkg}
          disabled={!canSubscribe}
          isCurrent={
            pkg.id === activeSubscription?.package_name
            || pkg.id === pendingSubscription?.package_name
          }
          loading={subscribingPackage === pkg.id}
          onSubscribe={() => onSubscribe(pkg.id)}
        />
      ))}
    </>
  );
}
