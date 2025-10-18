
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { BikeColors } from '../constants/BikeColors';
import { Station } from '../types/BikeTypes';
import type { StationType } from '../types/StationType';
interface StationCardProps {
  station: Station;
  onPress: () => void;
}

export function StationCard({ station, onPress }: StationCardProps) {
  const availabilityPercentage = (station.availableBikes / station.totalSlots) * 100;
  const manualBikes = station.bikes?.filter(bike => bike.type === 'manual').length || 0;
  const availableManual = station.bikes?.filter(bike => bike.type === 'manual' && bike.isAvailable).length || 0;
  
  const getAvailabilityColor = (percentage: number) => {
    if (percentage > 60) return BikeColors.success;
    if (percentage > 30) return BikeColors.warning;
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
          <View style={[styles.statusIndicator, { backgroundColor: station.isActive ? BikeColors.success : BikeColors.error }]} />
          <IconSymbol name="chevron.right" size={16} color={BikeColors.onSurfaceVariant} />
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.locationContainer}>
          <IconSymbol name="location.fill" size={16} color={BikeColors.onSurfaceVariant} />
          <Text style={styles.locationText} numberOfLines={2}>
            {station.location.address}
          </Text>
        </View>

        <View style={styles.availabilityContainer}>
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityLabel}>Tổng xe có sẵn:</Text>
            <Text style={[styles.availabilityCount, { color: getAvailabilityColor(availabilityPercentage) }]}>
              {station.availableBikes}/{station.totalSlots}
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${availabilityPercentage}%`,
                  backgroundColor: getAvailabilityColor(availabilityPercentage)
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.bikeTypesContainer}>
          <View style={styles.bikeTypeItem}>
            <IconSymbol name="gear" size={16} color={BikeColors.primary} />
            <Text style={styles.bikeTypeText}>Xe thường: {availableManual}/{manualBikes}</Text>
          </View>
        </View>

        <View style={styles.actionHint}>
          <IconSymbol name="map.fill" size={14} color={BikeColors.accent} />
          <Text style={styles.actionHintText}>Nhấn để xem sơ đồ 2D và chi tiết xe</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: BikeColors.onSurface,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityLabel: {
    fontSize: 14,
    color: BikeColors.onSurfaceVariant,
  },
  availabilityCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: BikeColors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  bikeTypesContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  bikeTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bikeTypeText: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
    flex: 1,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BikeColors.divider,
  },
  actionHintText: {
    fontSize: 12,
    color: BikeColors.accent,
    fontStyle: 'italic',
  },
});
