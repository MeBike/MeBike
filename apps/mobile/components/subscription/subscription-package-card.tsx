import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { SubscriptionPackageInfo } from "@constants/subscriptionPackages";

import { formatCurrency } from "@utils/subscription";

type Props = {
  info: SubscriptionPackageInfo;
  disabled?: boolean;
  isCurrent?: boolean;
  loading?: boolean;
  onSubscribe?: () => void;
};

export function SubscriptionPackageCard({ info, disabled, isCurrent, loading, onSubscribe }: Props) {
  return (
    <LinearGradient colors={info.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{info.title}</Text>
          <Text style={styles.description}>{info.description}</Text>
        </View>
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>Đã đăng ký</Text>
          </View>
        )}
      </View>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.price}>{formatCurrency(info.price)}</Text>
          <Text style={styles.limitLabel}>
            {info.monthlyLimit ? `${info.monthlyLimit} lượt / tháng` : "Không giới hạn"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.ctaButton, disabled && styles.ctaButtonDisabled]}
        onPress={onSubscribe}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>{isCurrent ? "Đang sử dụng" : "Đăng ký ngay"}</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  description: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    flexShrink: 1,
  },
  currentBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  currentText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  priceRow: {
    marginTop: 16,
  },
  price: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },
  limitLabel: {
    color: "rgba(255,255,255,0.9)",
  },
  ctaButton: {
    marginTop: 18,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
