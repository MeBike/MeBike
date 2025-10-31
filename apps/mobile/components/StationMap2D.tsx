import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bike } from "lucide-react-native";
import type { Bike as BikeType } from "../types/BikeTypes";
import type { StationType } from "../types/StationType";
import { BikeColors } from "../constants/BikeColors";

const MAP_WIDTH = 400;
const MAP_HEIGHT = 100;

const BikeIcon = ({ color = "#fff", size = 16 }) => (
  <Bike color={color} size={size} />
);

const StationMap2D = ({ station, bikes, selectedBike, onBikePress }: {
  station: StationType;
  bikes: BikeType[];
  selectedBike: BikeType | null;
  onBikePress: (bike: BikeType) => void;
}) => {
  const capacity = Number.parseInt(station.capacity, 10) || 0;
  const slots = Array.from({ length: capacity }, (_, i) => bikes[i] || null);

  const getSlotColor = (bike: BikeType | null) => {
    if (!bike) return BikeColors.error;
    return bike.status === "CÓ SẴN" ? BikeColors.success : BikeColors.error;
  };

  const renderSlots = () => {
    const size = 19; // dùng đúng size style
    const gap = 20;
    const cols = 10;

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
              backgroundColor: bike
                ? getSlotColor(bike)
                : BikeColors.surfaceVariant,
              borderWidth: isSelected ? 3 : 1.5,
              borderColor: isSelected ? BikeColors.accent : BikeColors.divider,
              opacity: bike ? 1 : 0.5,
            },
          ]}
        >
          {bike ? (
            <>
              <BikeIcon color="#fff" size={18} />
              <Text style={styles.bikeIdText}>{bike._id.slice(-3)}</Text>
            </>
          ) : (
            <BikeIcon color={BikeColors.error} size={18} />
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
          <View style={styles.stationLayout} />
          {renderSlots()}
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View
            style={[styles.legendItem, { backgroundColor: BikeColors.success }]}
          >
            <BikeIcon color="#fff" size={12} />
          </View>
          <Text style={styles.legendText}>Xe có sẵn</Text>
        </View>
        <View style={styles.legendRow}>
          <View
            style={[styles.legendItem, { backgroundColor: BikeColors.error }]}
          >
            <BikeIcon color="#fff" size={12} />
          </View>
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
    borderRadius: 20,
    padding: 20,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: BikeColors.onSurface,
    marginBottom: 12,
    alignSelf: "center",
    letterSpacing: 1,
  },
  mapContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  mapBackground: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    // backgroundColor: BikeColors.surfaceVariant,
    // borderRadius: 16,
    // position: "relative",
    // borderWidth: 2,
    // borderColor: BikeColors.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  stationLayout: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,

   
    borderStyle: "dashed",
    zIndex: 0,
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
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 1,
    backgroundColor: BikeColors.surfaceVariant,
  },
  bikeIdText: {
    fontSize: 9,
    color: "white",
    fontWeight: "bold",
    lineHeight: 14,
  },
  legend: {
    gap: 9,
    flexDirection: "row",
    marginTop: 10,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    gap: 6,
  },
  legendItem: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.09)",
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  legendText: {
    fontSize: 13,
    color: BikeColors.onSurfaceVariant,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
});
