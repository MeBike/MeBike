import { StyleSheet, Text, View } from "react-native";

import type { StationType } from "../../../types/StationType";

import { IconSymbol } from "../../../components/IconSymbol";
import { BikeColors } from "../../../constants/BikeColors";

const styles = StyleSheet.create({
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stationDetails: {
    flex: 1,
  },
  stationName: {
    fontSize: 20,
    fontWeight: "600",
    color: BikeColors.onSurface,
  },
  stationAddress: {
    fontSize: 14,
    color: BikeColors.onSurfaceVariant,
    marginTop: 4,
  },
  stationRating: {
    fontSize: 12,
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
    fontWeight: "500",
    color: BikeColors.onPrimary,
  },
});

type StationInfoCardProps = {
  station: StationType;
};

export function StationInfoCard({ station }: StationInfoCardProps) {
  return (
    <View style={styles.stationInfo}>
      <View style={styles.stationHeader}>
        <IconSymbol
          name="building.2.fill"
          size={32}
          color={BikeColors.primary}
        />
        <View style={styles.stationDetails}>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={styles.stationAddress}>{station.address}</Text>
          {station.total_ratings !== undefined
            ? (
                station.total_ratings > 0
                  ? (
                      <Text style={styles.stationRating}>
                        ⭐
                        {" "}
                        {station.average_rating?.toFixed(1)}
                        {" "}
                        (
                        {station.total_ratings}
                        {" "}
                        đánh giá)
                      </Text>
                    )
                  : (
                      <Text style={styles.stationRating}>
                        Chưa có đánh giá
                      </Text>
                    )
              )
            : null}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: BikeColors.success },
          ]}
        >
          <Text style={styles.statusText}>Hoạt động</Text>
        </View>
      </View>
    </View>
  );
}
