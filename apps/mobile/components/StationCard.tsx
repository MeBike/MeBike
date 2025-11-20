import React from "react";
import { Pressable, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Linking } from "react-native";

import type { Station, StationType } from "../types/StationType";

import { BikeColors } from "../constants/BikeColors";
import { IconSymbol } from "./IconSymbol";

type StationCardProps = {
  station: Station | StationType;
  onPress: () => void;
};

export function StationCard({ station, onPress }: StationCardProps) {
  const capacity = parseInt(station.capacity) || 1;
  const availabilityPercentage = (station.availableBikes / capacity) * 100;

  const getAvailabilityColor = (percentage: number) => {
    if (percentage > 60)
      return BikeColors.success;
    if (percentage > 30)
      return BikeColors.warning;
    return BikeColors.error;
  };

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
          <View style={[styles.statusIndicator, { backgroundColor: station.availableBikes > 0 ? BikeColors.success : BikeColors.error }]} />
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

        {(station as any).total_ratings !== undefined && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>
              {(station as any).total_ratings > 0 ? (
                <>⭐ {(station as any).average_rating?.toFixed(1)} ({(station as any).total_ratings})</>
              ) : (
                <>Chưa có đánh giá</>
              )}
            </Text>
          </View>
        )}

        <View style={styles.availabilityContainer}>
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityLabel}>Tổng xe có sẵn:</Text>
            <Text style={[styles.availabilityCount, { color: getAvailabilityColor(availabilityPercentage) }]}>
              {station.availableBikes}
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
                  backgroundColor: getAvailabilityColor(availabilityPercentage),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <View style={styles.actionHint}>
            <IconSymbol name="map.fill" size={14} color={BikeColors.accent} />
            <Text style={styles.actionHintText}>Nhấn để xem chi tiết</Text>
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
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    color: BikeColors.onSurfaceVariant,
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
  actionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BikeColors.divider,
  },
  actionHintText: {
    fontSize: 12,
    color: BikeColors.accent,
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BikeColors.divider,
  },
  directionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: BikeColors.primary,
    borderRadius: 8,
  },
  directionButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
});
