import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { BikeColors } from "@constants";

type Props = {
  slotStart?: string;
  totalDates: number;
};

export function InfoHighlights({ slotStart, totalDates }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.label}>Giờ bắt đầu</Text>
        <Text style={styles.value}>{slotStart ?? "--:--"}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>Số ngày áp dụng</Text>
        <Text style={styles.value}>{totalDates}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
  },
  item: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  label: {
    fontSize: 12,
    color: BikeColors.textSecondary,
    textTransform: "uppercase",
  },
  value: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "700",
    color: BikeColors.textPrimary,
  },
});
