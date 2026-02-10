import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Subscription } from "@/types/subscription-types";

import { SubscriptionHistoryItem } from "@components/subscription/subscription-history-item";

type Props = {
  subscriptions: Subscription[];
  isLoading: boolean;
  onSelect: (id: string) => void;
};

export function SubscriptionHistorySection({ subscriptions, isLoading, onSelect }: Props) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử gói của bạn</Text>
        <Text style={styles.count}>{subscriptions.length} gói</Text>
      </View>

      {isLoading && <Text style={styles.hint}>Đang tải lịch sử...</Text>}
      {!isLoading && subscriptions.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Chưa có gói nào</Text>
          <Text style={styles.emptySubtitle}>Khi đăng ký gói, bạn sẽ thấy lịch sử tại đây.</Text>
        </View>
      )}

      {subscriptions.map((subscription) => (
        <SubscriptionHistoryItem
          key={subscription.id}
          subscription={subscription}
          onPress={(item) => onSelect(item.id)}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  count: {
    color: "#6B7280",
  },
  hint: {
    color: "#6B7280",
    marginBottom: 12,
  },
  empty: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  emptySubtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 6,
  },
});
