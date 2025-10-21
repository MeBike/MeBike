import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { StationType } from "../types/StationType";
import { Bike } from "../types/BikeTypes";
import { BikeColors } from "../constants/BikeColors";

const MAP_WIDTH = 400;
const MAP_HEIGHT = 100;

interface StationMap2DProps {
  station: StationType;
  bikes: Bike[];
  selectedBike?: Bike | null;
  onBikePress: (bike: Bike) => void;
}

const StationMap2D: React.FC<StationMap2DProps> = ({
  station,
  bikes,
  selectedBike,
  onBikePress,
}) => {
  const capacity = parseInt(station.capacity, 10) || 0;

  // lấy danh sách slot = capacity, map bike vào slot
  const slots = Array.from({ length: capacity }, (_, i) => {
    const bike = bikes[i]; // đơn giản: gán xe theo index
    return bike || null;
  });

  // màu marker dựa vào xe trong slot
  const getSlotColor = (bike: Bike | null) => {
    if (!bike) return BikeColors.error; // slot trống = đỏ
    return bike.status === "CÓ SẴN" ? BikeColors.success : BikeColors.error;
  };

  // render grid theo hàng
  const renderSlots = () => {
    const cols = 10; // số cột (fix)
    const size = 20; // kích thước marker
    const gap = 18;

    return slots.map((bike, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const left = col * (size + gap) + 10;
      const top = row * (size + gap) + 10;
      const isSelected = selectedBike?._id === bike?._id;

      return (
        <Pressable
          key={index}
          disabled={!bike}
          onPress={() => bike && onBikePress(bike)}
          style={[
            styles.bikeMarker,
            {
              left,
              top,
              backgroundColor: getSlotColor(bike),
              borderWidth: isSelected ? 2 : 0,
              borderColor: isSelected ? BikeColors.accent : "transparent",
            },
          ]}
        >
          {bike && (
            <Text style={{ fontSize: 8, color: "white", fontWeight: "bold" }}>
              {bike._id.slice(-3)}
            </Text>
          )}
        </Pressable>
      );
    });
  };

  return (
    <View style={styles.mapSection}>
      <Text style={styles.sectionTitle}>Sơ đồ trạm 2D</Text>
      <View style={styles.mapContainer}>
        <View style={styles.mapBackground}>
          {/* Station Layout */}
          <View style={styles.stationLayout} />
          {/* Slots */}
          {renderSlots()}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View
            style={[styles.legendItem, { backgroundColor: BikeColors.success }]}
          />
          <Text style={styles.legendText}>Xe có sẵn</Text>
        </View>
        <View style={styles.legendRow}>
          <View
            style={[styles.legendItem, { backgroundColor: BikeColors.error }]}
          />
          <Text style={styles.legendText}>Slot trống / xe không khả dụng</Text>
        </View>
      </View>
    </View>
  );
};

export default StationMap2D;

const styles = StyleSheet.create({
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
    fontWeight: "600",
    color: BikeColors.onSurface,
    marginBottom: 16,
  },
  mapContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  mapBackground: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: BikeColors.surfaceVariant,
    borderRadius: 12,
    position: "relative",
    borderWidth: 2,
    borderColor: BikeColors.divider,
  },
  stationLayout: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BikeColors.divider,
    borderStyle: "dashed",
  },
  bikeMarker: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  legend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
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
});
