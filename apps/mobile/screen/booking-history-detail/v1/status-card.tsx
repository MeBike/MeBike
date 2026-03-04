import { Ionicons } from "@expo/vector-icons";
import { formatVietnamDateTime } from "@utils/date";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { RentalStatus } from "@/types/rental-types";

type RentalStatusCardProps = {
  status: RentalStatus;
  startTime?: string;
  duration?: number;
  totalPrice?: number;
};

function statusColor(status: RentalStatus) {
  switch (status) {
    case "COMPLETED":
      return "#16A34A";
    case "RENTED":
      return "#B45309";
    case "CANCELLED":
      return "#DC2626";
    case "RESERVED":
      return "#FFB020";
    default:
      return "#6B7280";
  }
}

function statusSoftBackground(status: RentalStatus) {
  switch (status) {
    case "COMPLETED":
      return "#ECFDF3";
    case "RENTED":
      return "#FFF7ED";
    case "CANCELLED":
      return "#FEF2F2";
    case "RESERVED":
      return "#EEF2FF";
    default:
      return "#F3F4F6";
  }
} 

function statusText(status: RentalStatus) {
  switch (status) {
    case "COMPLETED":
      return "Hoàn thành";
    case "RENTED":
      return "Đang thuê";
    case "CANCELLED":
      return "Đã hủy";
    case "RESERVED":
      return "Đã đặt trước";
    default:
      return status;
  }
}

function statusIcon(status: RentalStatus) {
  switch (status) {
    case "COMPLETED":
      return "checkmark-circle";
    case "RENTED":
      return "time";
    case "CANCELLED":
      return "close-circle";
    case "RESERVED":
      return "bookmark";
    default:
      return "help-circle";
  }
}

function formatDuration(durationMinutes?: number) {
  if (!durationMinutes || durationMinutes <= 0) {
    return "--";
  }

  const totalMinutes = Math.floor(durationMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  if (hours > 0) {
    return `${hours} giờ`;
  }
  return `${minutes} phút`;
}

export function RentalStatusCard({ status, startTime, duration, totalPrice }: RentalStatusCardProps) {
  const color = statusColor(status);

  return (
    <View style={styles.statusCard}>
      <View style={styles.topRow}>
        <View style={[styles.statusPill, { backgroundColor: statusSoftBackground(status) }]}>
          <Ionicons
            name={statusIcon(status) as never}
            size={18}
            color={color}
          />
          <Text style={[styles.statusText, { color }]}>{statusText(status)}</Text>
        </View>
        <Text style={styles.dateText}>{startTime ? formatVietnamDateTime(startTime) : "--"}</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Thời lượng</Text>
          <Text style={styles.metricValue}>{formatDuration(duration)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Tổng tiền</Text>
          <Text style={styles.metricValuePrimary}>
            {(totalPrice ?? 0).toLocaleString("vi-VN")}
            {" "}
            đ
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E3E8F2",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 12,
  },
  metricItem: {
    flex: 1,
    gap: 4,
  },
  metricDivider: {
    width: 1,
    backgroundColor: "#EEF2F7",
    marginHorizontal: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "700",
  },
  metricValuePrimary: {
    fontSize: 18,
    color: "#1D4ED8",
    fontWeight: "700",
  },
});
