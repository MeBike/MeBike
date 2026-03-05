import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type StationMapMarkerProps = {
  count: number;
  isSelected?: boolean;
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  markerContainerZero: {
    opacity: 1,
  },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BikeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: BikeColors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    transform: [{ scale: 1.12 }],
    borderWidth: 3,
    borderColor: "#BFDBFE",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 7,
  },
  markerZero: {
    backgroundColor: BikeColors.error,
    borderColor: BikeColors.background,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: BikeColors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BikeColors.divider,
  },
  badgeSelected: {
    borderColor: "#93C5FD",
  },
  markerText: {
    color: BikeColors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
});

export function StationMapMarker({ count, isSelected = false }: StationMapMarkerProps) {
  return (
    <View style={[styles.markerContainer, count === 0 && styles.markerContainerZero]}>
      <View style={[styles.marker, isSelected && styles.markerSelected, count === 0 && styles.markerZero]}>
        <Ionicons
          name="bicycle"
          size={18}
          color="white"
        />
      </View>
      {count > 0
        ? (
            <View style={[styles.badge, isSelected && styles.badgeSelected]}>
              <Text style={styles.markerText}>{count}</Text>
            </View>
          )
        : null}
    </View>
  );
}
