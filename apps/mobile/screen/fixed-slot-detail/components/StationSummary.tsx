import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { BikeColors } from "@constants/BikeColors";

import { STATUS_STYLES } from "../utils";

type Props = {
  name?: string | null;
  stationId?: string | null;
  status: string;
};

export function StationSummary({ name, stationId, status }: Props) {
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES["ĐANG HOẠT ĐỘNG"];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {name ?? "Không xác định"}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusStyle.backgroundColor }]}
        >
          <Text style={[styles.badgeText, { color: statusStyle.color }]}>{status}</Text>
        </View>
      </View>
      {stationId ? (
        <Text style={styles.meta} numberOfLines={1} ellipsizeMode="middle">
          ID: {stationId}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: BikeColors.textPrimary,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  meta: {
    color: BikeColors.textSecondary,
  },
});
