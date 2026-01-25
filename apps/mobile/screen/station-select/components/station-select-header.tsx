import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  header: {
    width: "100%",
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  findNearbyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  findNearbyButtonDisabled: {
    opacity: 0.5,
  },
  findNearbyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

type StationSelectHeaderProps = {
  insets: { top: number };
  onNearbyPress: () => void;
  nearbyDisabled?: boolean;
};

export function StationSelectHeader({
  insets,
  onNearbyPress,
  nearbyDisabled,
}: StationSelectHeaderProps) {
  return (
    <LinearGradient
      colors={["#0066FF", "#00B4D8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 16 }]}
    >
      <Text style={styles.headerTitle}>Trạm thuê xe</Text>
      <Text style={styles.headerSubtitle}>Chọn một trạm để xem chi tiết</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.findNearbyButton,
            nearbyDisabled && styles.findNearbyButtonDisabled,
          ]}
          onPress={onNearbyPress}
          disabled={nearbyDisabled}
        >
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={styles.findNearbyButtonText}>Tìm trạm gần bạn</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
