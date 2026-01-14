import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  findNearbyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
});

type StationSelectHeaderProps = {
  showingNearby: boolean;
  isLoadingNearbyStations: boolean;
  insets: { top: number };
  onFindNearby: () => void;
};

export function StationSelectHeader({
  showingNearby,
  isLoadingNearbyStations,
  insets,
  onFindNearby,
}: StationSelectHeaderProps) {
  return (
    <LinearGradient
      colors={["#0066FF", "#00B4D8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 16 }]}
    >
      <Text style={styles.headerTitle}>Trạm thuê xe</Text>
      <Text style={styles.headerSubtitle}>
        Chọn một trạm để xem chi tiết

      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.findNearbyButton}
          onPress={onFindNearby}
          disabled={isLoadingNearbyStations}
        >
          {isLoadingNearbyStations
            ? (
                <ActivityIndicator color="#fff" size="small" />
              )
            : (
                <>
                  <Ionicons name="location" size={16} color="#fff" />
                  <Text style={styles.findNearbyButtonText}>
                    {showingNearby ? "Tất cả trạm" : "Tìm trạm gần bạn"}
                  </Text>
                </>
              )}
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
}
