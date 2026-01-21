import type { SubscriptionPackageInfo } from "@constants/subscriptionPackages";

import { SubscriptionPackageCard } from "@components/subscription/subscription-package-card";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type {
  SubscriptionListItem,
} from "@/types/subscription-types";

type Props = {
  packages: SubscriptionPackageInfo[];
  activeSubscription: SubscriptionListItem | null;
  pendingSubscription: SubscriptionListItem | null;
  canSubscribe: boolean;
  subscribingPackage: string | null;
  onSubscribe: (pkgId: string) => void;
  emptySubtitle?: string;
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginVertical: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
    textAlign: "center",
  },
});

export function SubscriptionPlansList({
  packages,
  activeSubscription,
  pendingSubscription,
  canSubscribe,
  subscribingPackage,
  onSubscribe,
  emptySubtitle = "Hiện chưa có gói nào khả dụng. Vui lòng thử lại sau.",
}: Props) {
  return (
    <>
      <Text style={styles.title}>Chọn gói phù hợp</Text>

      {packages.length === 0
        ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="pricetags-outline" size={26} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có gói đăng ký</Text>
              <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
            </View>
          )
        : (
            packages.map(pkg => (
              <SubscriptionPackageCard
                key={pkg.backendId ?? pkg.id}
                info={pkg}
                disabled={!canSubscribe}
                isCurrent={
                  pkg.backendId === activeSubscription?.packageId
                  || pkg.backendId === pendingSubscription?.packageId
                }
                loading={subscribingPackage === pkg.backendId}
                onSubscribe={() => onSubscribe(pkg.backendId ?? pkg.id)}
              />
            ))
          )}
    </>
  );
}
