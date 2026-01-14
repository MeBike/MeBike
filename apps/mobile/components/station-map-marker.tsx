import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type StationMapMarkerProps = {
  count: number;
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  markerContainerZero: {
    opacity: 0.7,
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
  markerZero: {
    backgroundColor: BikeColors.lightGray,
    borderColor: BikeColors.divider,
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
  markerText: {
    color: BikeColors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
});

export function StationMapMarker({ count }: StationMapMarkerProps) {
  return (
    <View style={[styles.markerContainer, count === 0 && styles.markerContainerZero]}>
      <View style={[styles.marker, count === 0 && styles.markerZero]}>
        <Ionicons
          name={count === 0 ? "close" : "bicycle"}
          size={18}
          color={count === 0 ? BikeColors.textSecondary : "white"}
        />
      </View>
      {count > 0
        ? (
            <View style={styles.badge}>
              <Text style={styles.markerText}>{count}</Text>
            </View>
          )
        : null}
    </View>
  );
}
