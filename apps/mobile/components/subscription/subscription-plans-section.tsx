import type { SubscriptionPackageInfo } from "@constants/subscriptionPackages";

import { SubscriptionPackageCard } from "@components/subscription/subscription-package-card";
import React from "react";
import { StyleSheet, Text } from "react-native";

import type {
  SubscriptionListItem,
} from "@/types/subscription-types";

type Props = {
  packages: SubscriptionPackageInfo[];
  activeSubscription: SubscriptionListItem | null;
  pendingSubscription: SubscriptionListItem | null;
  canSubscribe: boolean;
  isLoading: (pkgId: string) => boolean;
  onSubscribe: (pkgId: string) => void;
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
      {packages.map(pkg => (
        <SubscriptionPackageCard
          key={pkg.backendId ?? pkg.id}
          info={pkg}
          disabled={!canSubscribe}
          isCurrent={
            pkg.backendId === activeSubscription?.packageId
            || pkg.backendId === pendingSubscription?.packageId
          }
          loading={isLoading(pkg.backendId ?? pkg.id)}
          onSubscribe={() => onSubscribe(pkg.backendId ?? pkg.id)}
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
