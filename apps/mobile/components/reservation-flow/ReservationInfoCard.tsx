import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { BikeColors } from "@constants/BikeColors";

type Props = {
  stationName?: string;
  stationAddress?: string;
  bikeName?: string;
};

export function ReservationInfoCard({
  stationName,
  stationAddress,
  bikeName,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Trạm</Text>
      <Text style={styles.stationName}>
        {stationName ?? "Chưa xác định"}
      </Text>
      {stationAddress && (
        <Text style={styles.stationAddress}>{stationAddress}</Text>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Xe đã chọn</Text>
      <Text style={styles.bikeName}>
        {bikeName ?? "Chưa chọn xe"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BikeColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  sectionLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    color: BikeColors.textSecondary,
    letterSpacing: 0.5,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  stationAddress: {
    fontSize: 14,
    color: BikeColors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: BikeColors.divider,
    marginVertical: 12,
  },
  bikeName: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
});
