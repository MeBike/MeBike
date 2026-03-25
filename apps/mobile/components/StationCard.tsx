import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { StationReadSummary } from "@/contracts/server";

import { BikeColors } from "../constants/BikeColors";
import { IconSymbol } from "./IconSymbol";

type StationCardProps = {
  station: StationReadSummary;
  onPress: () => void;
};

export function StationCard({ station, onPress }: StationCardProps) {
  const capacity = station.capacity.total || 1;
  const availableBikes = station.bikes.available;
  const availabilityPercentage = (availableBikes / capacity) * 100;

  const getAvailabilityColor = (availableBikes: number, percentage: number) => {
    if (availableBikes <= 0)
      return "#94A3B8";
    if (availableBikes <= 3)
      return "#F59E0B";
    if (percentage > 60)
      return BikeColors.success;
    return "#F59E0B";
  };

  const availabilityColor = getAvailabilityColor(availableBikes, availabilityPercentage);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.stationInfo}>
          <IconSymbol name="building.2.fill" size={24} color={BikeColors.primary} />
          <Text style={styles.stationName} numberOfLines={1}>
            {station.name}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusIndicator, { backgroundColor: availabilityColor }]} />
          <IconSymbol name="chevron.right" size={16} color={BikeColors.onSurfaceVariant} />
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.locationContainer}>
          <IconSymbol name="location.fill" size={16} color={BikeColors.onSurfaceVariant} />
          <Text style={styles.locationText} numberOfLines={2}>
            {station.address}
          </Text>
        </View>

        <View style={styles.availabilityContainer}>
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityLabel}>Tổng xe có sẵn:</Text>
            <Text style={[styles.availabilityCount, { color: availabilityColor }]}>
              {availableBikes}
              /
              {capacity}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${availabilityPercentage}%`,
                  backgroundColor: availabilityColor,
                },
              ]}
            />
          </View>
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
  stationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.onSurface,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  details: {
    gap: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: BikeColors.onSurfaceVariant,
    lineHeight: 20,
  },
  availabilityContainer: {
    gap: 8,
  },
  availabilityInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  availabilityLabel: {
    fontSize: 14,
    color: BikeColors.onSurfaceVariant,
  },
  availabilityCount: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    backgroundColor: BikeColors.divider,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  bikeTypesContainer: {
    flexDirection: "row",
    gap: 16,
  },
  bikeTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  bikeTypeText: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
    flex: 1,
  },
});
