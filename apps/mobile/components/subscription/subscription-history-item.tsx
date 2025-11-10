import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { SubscriptionListItem } from "@/types/subscription-types";

import { formatCurrency, formatDate, getStatusStyle } from "@utils/subscription";

type Props = {
  subscription: SubscriptionListItem;
  onPress?: (subscription: SubscriptionListItem) => void;
};

export function SubscriptionHistoryItem({ subscription, onPress }: Props) {
  const status = getStatusStyle(subscription.status);
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(subscription)} activeOpacity={0.9}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{subscription.package_name.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Đăng ký: {formatDate(subscription.created_at)}</Text>
        <Text style={styles.subtitle}>Hết hạn: {formatDate(subscription.expires_at)}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.amount}>{formatCurrency(subscription.price)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
          <Text style={[styles.statusText, { color: status.text }]}>{subscription.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  meta: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
