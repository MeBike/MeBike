import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { SubscriptionListItem } from "@/types/subscription-types";

import { formatCurrency, formatDate, getStatusStyle } from "@utils/subscription";

type Props = {
  activeSubscription?: SubscriptionListItem | null;
  pendingSubscription?: SubscriptionListItem | null;
  onActivatePending?: () => void;
  activating?: boolean;
};

export function SubscriptionSummary({
  activeSubscription,
  pendingSubscription,
  onActivatePending,
  activating,
}: Props) {
  const hasActive = Boolean(activeSubscription);
  const hasPending = Boolean(pendingSubscription);

  const title = hasActive
    ? "Gói đang hoạt động"
    : hasPending
      ? "Bạn có gói đang chờ kích hoạt"
      : "Chưa đăng ký gói tháng";

  const description = (() => {
    if (hasActive && activeSubscription) {
      const limit = activeSubscription.max_usages;
      const used = activeSubscription.usage_count;
      const quota = limit ? `${used}/${limit} lượt` : `${used} lượt đã dùng`;
      return `Hạn: ${formatDate(activeSubscription.expires_at)} • ${quota}`;
    }
    if (hasPending && pendingSubscription) {
      return `Đăng ký ngày ${formatDate(pendingSubscription.created_at)} - kích hoạt để sử dụng ngay.`;
    }
    return "Chọn gói phù hợp để nhận thêm lượt đặt xe và ưu đãi.";
  })();

  const status = hasActive
    ? activeSubscription?.status
    : hasPending
      ? pendingSubscription?.status
      : undefined;
  const amount = hasActive
    ? activeSubscription!.price
    : hasPending
      ? pendingSubscription!.price
      : 0;

  const statusStyle = status ? getStatusStyle(status) : undefined;

  return (
    <LinearGradient
      colors={hasActive ? ["#2563EB", "#38BDF8"] : ["#4B5563", "#9CA3AF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        {status && statusStyle && (
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{status}</Text>
          </View>
        )}
      </View>

      {(hasActive || hasPending) && (
        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>Giá gói</Text>
            <Text style={styles.amount}>{formatCurrency(amount)}</Text>
          </View>
          {hasPending && onActivatePending && (
            <TouchableOpacity style={styles.activateButton} onPress={onActivatePending} disabled={activating}>
              {activating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.activateText}>Kích hoạt ngay</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  amountRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },
  amount: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  activateButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  activateText: {
    color: "white",
    fontWeight: "600",
  },
});
