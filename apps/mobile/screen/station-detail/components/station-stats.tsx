import { StyleSheet, Text, View } from "react-native";

import type { StationType } from "../../../types/StationType";

import { IconSymbol } from "../../../components/IconSymbol";
import { BikeColors } from "../../../constants/BikeColors";

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: BikeColors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: BikeColors.onSurface,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: BikeColors.onSurfaceVariant,
    marginTop: 2,
    textAlign: "center",
  },
});

type StationStatsProps = {
  station: StationType;
};

export function StationStats({ station }: StationStatsProps) {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <IconSymbol name="bicycle.circle.fill" size={24} color={BikeColors.primary} />
        <Text style={styles.statNumber}>{station.totalBikes}</Text>
        <Text style={styles.statLabel}>Tổng số Xe</Text>
      </View>
      <View style={styles.statCard}>
        <IconSymbol
          name="bicycle.circle.fill"
          size={24}
          color={BikeColors.success}
        />
        <Text style={styles.statNumber}>{station.availableBikes}</Text>
        <Text style={styles.statLabel}>Xe có sẵn</Text>
      </View>
      <View style={styles.statCard}>
        <IconSymbol name="person.fill" size={24} color={BikeColors.error} />
        <Text style={styles.statNumber}>{station.bookedBikes}</Text>
        <Text style={styles.statLabel}>Xe đang thuê</Text>
      </View>
      <View style={styles.statCard}>
        <IconSymbol name="gear" size={24} color={BikeColors.primary} />
        <Text style={styles.statNumber}>{station.reservedBikes}</Text>
        <Text style={styles.statLabel}>Xe đã được đặt trước</Text>
      </View>
    </View>
  );
}
