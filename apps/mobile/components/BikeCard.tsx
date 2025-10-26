import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Bike } from "@/types/BikeTypes";

import { BikeColors } from "@/constants/BikeColors";

import { IconSymbol } from "./IconSymbol";

type BikeCardProps = {
  bike: Bike;
  onPress: () => void;
};

export function BikeCard({ bike, onPress }: BikeCardProps) {
  const getBatteryColor = (level: number) => {
    if (level > 60)
      return BikeColors.success;
    if (level > 30)
      return BikeColors.warning;
    return BikeColors.error;
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString("vi-VN")}đ/phút`;
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.bikeInfo}>
          <IconSymbol
            name={bike.type === "electric" ? "bolt.fill" : "bicycle"}
            size={24}
            color={bike.type === "electric" ? BikeColors.accent : BikeColors.primary}
          />
          <Text style={styles.bikeId}>
            #
            {bike.id.slice(-3)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: bike.isAvailable ? BikeColors.success : BikeColors.disabled }]}>
          <Text style={styles.statusText}>
            {bike.isAvailable ? "Có sẵn" : "Đang sử dụng"}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.locationContainer}>
          <IconSymbol name="location.fill" size={16} color={BikeColors.onSurfaceVariant} />
          <Text style={styles.locationText} numberOfLines={1}>
            {bike.location.address}
          </Text>
        </View>

        {bike.type === "electric" && (
          <View style={styles.batteryContainer}>
            <IconSymbol name="battery.100" size={16} color={getBatteryColor(bike.batteryLevel)} />
            <Text style={[styles.batteryText, { color: getBatteryColor(bike.batteryLevel) }]}>
              {bike.batteryLevel}
              %
            </Text>
          </View>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{formatPrice(bike.pricePerMinute)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BikeColors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bikeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bikeId: {
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: BikeColors.onPrimary,
  },
  details: {
    gap: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: BikeColors.onSurfaceVariant,
  },
  batteryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  batteryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.primary,
  },
});
