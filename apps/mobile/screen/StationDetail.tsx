
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StationDetailScreenNavigationProp, StationDetailRouteProp } from '../types/navigation';
import { IconSymbol } from '../components/IconSymbol';
import { BikeColors } from '../constants/BikeColors';
import { mockStations, mockBikes } from '../data/mockData';
// import { Bike, Station } from '../types/BikeTypes';

const { width: screenWidth } = Dimensions.get('window');
const MAP_PADDING = 20;
const MAP_WIDTH = screenWidth - (MAP_PADDING * 2);
const MAP_HEIGHT = 300;

export default function StationDetailScreen() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const route = useRoute<StationDetailRouteProp>();
  const { stationId } = route.params;
  const [selectedBike, setSelectedBike] = useState<any | null>(null);
  
  const station = mockStations.find(s => s.id === stationId);
  const stationBikes = mockBikes.filter(bike => bike.stationId === stationId);

  if (!station) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy trạm</Text>
      </View>
    );
  }

  const availableBikes = stationBikes.filter(bike => bike.isAvailable);
  const occupiedBikes = stationBikes.filter(bike => !bike.isAvailable);
  const electricBikes = stationBikes.filter(bike => bike.type === 'electric');
  const manualBikes = stationBikes.filter(bike => bike.type === 'manual');

  const handleBikePress = (bike: any) => {
    console.log('Bike selected:', bike.id);
    setSelectedBike(bike);
    
    if (bike.isAvailable) {
      Alert.alert(
        'Thuê xe đạp',
        `Xe #${bike.id.slice(-3)}\nLoại: ${bike.type === 'electric' ? 'Điện' : 'Thường'}\nPin: ${bike.batteryLevel}%\nGiá: ${bike.pricePerMinute.toLocaleString('vi-VN')}đ/phút\n\nBạn có muốn thuê xe này không?`,
        [
          { text: 'Hủy', style: 'cancel', onPress: () => setSelectedBike(null) },
          { 
            text: 'Thuê ngay', 
            onPress: () => {
              console.log('Renting bike:', bike.id);
              setSelectedBike(null);
              Alert.alert('Thành công', 'Xe đã được mở khóa! Quét mã QR để bắt đầu.');
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Xe đang được sử dụng',
        `Xe #${bike.id.slice(-3)} hiện đang được thuê bởi người khác.`,
        [{ text: 'OK', onPress: () => setSelectedBike(null) }]
      );
    }
  };

  const renderBikeOnMap = (bike: any) => {
    if (!bike.positionInStation) return null;

    const x = (bike.positionInStation.x / 100) * MAP_WIDTH;
    const y = (bike.positionInStation.y / 100) * MAP_HEIGHT;

    const getBikeColor = () => {
      if (!bike.isAvailable) return BikeColors.error;
      if (bike.type === 'electric') {
        if (bike.batteryLevel > 60) return BikeColors.success;
        if (bike.batteryLevel > 30) return BikeColors.warning;
        return BikeColors.error;
      }
      return BikeColors.primary;
    };

    const isSelected = selectedBike?.id === bike.id;

    return (
      <Pressable
        key={bike.id}
        style={[
          styles.bikeMarker,
          {
            left: x - 15,
            top: y - 15,
            backgroundColor: getBikeColor(),
            borderColor: isSelected ? BikeColors.accent : 'transparent',
            borderWidth: isSelected ? 3 : 0,
          }
        ]}
        onPress={() => handleBikePress(bike)}
      >
        <IconSymbol 
          name="bicycle" 
          size={16} 
          color={BikeColors.onPrimary} 
        />
        <Text style={styles.bikeSlotNumber}>{bike.positionInStation.slotNumber}</Text>
      </Pressable>
    );
  };

  const renderEntrance = (entrance: any, index: number) => {
    const x = (entrance.x / 100) * MAP_WIDTH;
    const y = (entrance.y / 100) * MAP_HEIGHT;

    return (
      <View
        key={index}
        style={[
          styles.entrance,
          {
            left: x - 10,
            top: y - 10,
            backgroundColor: entrance.type === 'main' ? BikeColors.accent : BikeColors.primary,
          }
        ]}
      >
        <IconSymbol 
          name={entrance.type === 'main' ? 'door.left.hand.open' : 'door.right.hand.open'} 
          size={12} 
          color={BikeColors.onPrimary} 
        />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Station Info */}
        <View style={styles.stationInfo}>
          <View style={styles.stationHeader}>
            <IconSymbol name="building.2.fill" size={32} color={BikeColors.primary} />
            <View style={styles.stationDetails}>
              <Text style={styles.stationName}>{station.name}</Text>
              <Text style={styles.stationAddress}>{station.location.address}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: station.isActive ? BikeColors.success : BikeColors.error }]}>
              <Text style={styles.statusText}>
                {station.isActive ? 'Hoạt động' : 'Tạm dừng'}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <IconSymbol name="bicycle" size={24} color={BikeColors.success} />
            <Text style={styles.statNumber}>{availableBikes.length}</Text>
            <Text style={styles.statLabel}>Xe có sẵn</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol name="person.fill" size={24} color={BikeColors.error} />
            <Text style={styles.statNumber}>{occupiedBikes.length}</Text>
            <Text style={styles.statLabel}>Đang thuê</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol name="bolt.fill" size={24} color={BikeColors.accent} />
            <Text style={styles.statNumber}>{electricBikes.length}</Text>
            <Text style={styles.statLabel}>Xe điện</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol name="gear" size={24} color={BikeColors.primary} />
            <Text style={styles.statNumber}>{manualBikes.length}</Text>
            <Text style={styles.statLabel}>Xe thường</Text>
          </View>
        </View>

        {/* 2D Station Map */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Sơ đồ trạm 2D</Text>
          <View style={styles.mapContainer}>
            <View style={styles.mapBackground}>
              {/* Station Layout */}
              <View style={styles.stationLayout} />
              
              {/* Entrances */}
              {station.layout.entrances.map((entrance: any, index: number) => 
                renderEntrance(entrance, index)
              )}
              
              {/* Bikes */}
              {stationBikes.map(bike => renderBikeOnMap(bike))}
            </View>
          </View>
          
          {/* Map Legend */}
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendItem, { backgroundColor: BikeColors.success }]} />
              <Text style={styles.legendText}>Xe có sẵn (Pin đầy)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendItem, { backgroundColor: BikeColors.warning }]} />
              <Text style={styles.legendText}>Xe có sẵn (Pin thấp)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendItem, { backgroundColor: BikeColors.error }]} />
              <Text style={styles.legendText}>Xe đang được thuê</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendItem, { backgroundColor: BikeColors.primary }]} />
              <Text style={styles.legendText}>Xe thường</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendItem, { backgroundColor: BikeColors.accent }]} />
              <Text style={styles.legendText}>Lối vào chính</Text>
            </View>
          </View>
        </View>

        {/* Bike List */}
        <View style={styles.bikeListSection}>
          <Text style={styles.sectionTitle}>Danh sách xe ({stationBikes.length})</Text>
          {stationBikes.map((bike) => (
            <Pressable
              key={bike.id}
              style={[
                styles.bikeItem,
                selectedBike?.id === bike.id && styles.selectedBikeItem
              ]}
              onPress={() => handleBikePress(bike)}
            >
              <View style={styles.bikeItemLeft}>
                <View style={[
                  styles.bikeStatusIndicator,
                  { backgroundColor: bike.isAvailable ? BikeColors.success : BikeColors.error }
                ]} />
                <View>
                  <Text style={styles.bikeId}>Xe #{bike.id.slice(-3)}</Text>
                  <Text style={styles.bikeType}>
                    {bike.type === 'electric' ? 'Xe điện' : 'Xe thường'} • Vị trí {bike.positionInStation?.slotNumber}
                  </Text>
                </View>
              </View>
              
              <View style={styles.bikeItemRight}>
                {bike.type === 'electric' && (
                  <View style={styles.batteryContainer}>
                    <IconSymbol name="battery.100" size={16} color={BikeColors.onSurfaceVariant} />
                    <Text style={styles.batteryText}>{bike.batteryLevel}%</Text>
                  </View>
                )}
                <Text style={styles.bikePrice}>
                  {bike.pricePerMinute.toLocaleString('vi-VN')}đ/phút
                </Text>
                <Text style={[
                  styles.bikeStatus,
                  { color: bike.isAvailable ? BikeColors.success : BikeColors.error }
                ]}>
                  {bike.isAvailable ? 'Có sẵn' : 'Đang thuê'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BikeColors.background,
  },
  errorText: {
    fontSize: 18,
    color: BikeColors.error,
  },
  backButton: {
    padding: 8,
  },
  stationInfo: {
    backgroundColor: BikeColors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stationDetails: {
    flex: 1,
  },
  stationName: {
    fontSize: 20,
    fontWeight: '600',
    color: BikeColors.onSurface,
  },
  stationAddress: {
    fontSize: 14,
    color: BikeColors.onSurfaceVariant,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: BikeColors.onPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: BikeColors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BikeColors.onSurface,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: BikeColors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },
  mapSection: {
    backgroundColor: BikeColors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BikeColors.onSurface,
    marginBottom: 16,
  },
  mapContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mapBackground: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: BikeColors.surfaceVariant,
    borderRadius: 12,
    position: 'relative',
    borderWidth: 2,
    borderColor: BikeColors.divider,
  },
  stationLayout: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BikeColors.divider,
    borderStyle: 'dashed',
  },
  bikeMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bikeSlotNumber: {
    position: 'absolute',
    bottom: -8,
    fontSize: 8,
    fontWeight: 'bold',
    color: BikeColors.onSurface,
    backgroundColor: BikeColors.surface,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  entrance: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  legend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendItem: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
  },
  bikeListSection: {
    backgroundColor: BikeColors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bikeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: BikeColors.background,
  },
  selectedBikeItem: {
    backgroundColor: BikeColors.primaryContainer,
    borderWidth: 2,
    borderColor: BikeColors.primary,
  },
  bikeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bikeStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bikeId: {
    fontSize: 16,
    fontWeight: '600',
    color: BikeColors.onSurface,
  },
  bikeType: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
    marginTop: 2,
  },
  bikeItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
  },
  bikePrice: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
  },
  bikeStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
});
