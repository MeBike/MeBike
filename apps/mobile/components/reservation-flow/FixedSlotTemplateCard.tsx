import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BikeColors } from "@constants/BikeColors";
import { presentFixedSlotStatus } from "@/presenters/fixed-slots/fixed-slot-presenter";

import type { FixedSlotTemplate } from "@/contracts/server";

type Props = {
  template: FixedSlotTemplate;
  isSelected?: boolean;
  onSelect?: () => void;
  onCancel?: () => void;
};

const STATUS_COLORS = {
  ACTIVE: BikeColors.success,
  CANCELLED: BikeColors.error,
};

export function FixedSlotTemplateCard({
  template,
  isSelected,
  onSelect,
  onCancel,
}: Props) {
  const statusColor = STATUS_COLORS[template.status] ?? BikeColors.textSecondary;
  const selectedDateCount = template.slotDates.length;
  const slotStartLabel = template.slotStart;
  const canCancel = template.status !== "CANCELLED";
  const statusLabel = presentFixedSlotStatus(template.status);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      activeOpacity={0.85}
      onPress={onSelect}
    >
      <View style={styles.row}>
        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>
            {template.station.name}
          </Text>
          <Text style={styles.metaText}>
            Giờ bắt đầu: {slotStartLabel}
          </Text>
          <Text style={styles.metaText}>
            Ngày đã chọn: {selectedDateCount}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      {canCancel && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={onCancel}
          >
            <Text style={styles.dangerText}>Huỷ</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F6F8FC",
    padding: 16,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    shadowColor: "#091E42",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardSelected: {
    borderColor: BikeColors.primary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  stationInfo: {
    flex: 1,
    gap: 4,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  metaText: {
    fontSize: 13,
    color: BikeColors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  dangerButton: {
    backgroundColor: "#FEE2E2",
  },
  dangerText: {
    color: BikeColors.error,
    fontWeight: "600",
  },
});
