import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { RentalStatus } from "@/types/rental-types";

function statusColor(status: RentalStatus) {
  switch (status) {
    case "COMPLETED":
      return "#4CAF50";
    case "RENTED":
      return "#FF9800";
    case "CANCELLED":
      return "#F44336";
    case "RESERVED":
      return "#7C3AED";
    default:
      return "#999";
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

export function RentalStatusCard({ status }: { status: RentalStatus }) {
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Ionicons
          name={statusIcon(status) as any}
          size={32}
          color={statusColor(status)}
        />
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>Trạng thái</Text>
          <Text style={[styles.statusText, { color: statusColor(status) }]}>
            {statusText(status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
