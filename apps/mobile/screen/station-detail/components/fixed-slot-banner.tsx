import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BikeColors } from "../../../constants/BikeColors";

const styles = StyleSheet.create({
  fixedSlotBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: BikeColors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fixedSlotTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  fixedSlotSubtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    fontSize: 13,
  },
});

type FixedSlotBannerProps = {
  _stationId: string;
  _stationName: string;
  onPress: () => void;
};

export function FixedSlotBanner({
  _stationId,
  _stationName,
  onPress,
}: FixedSlotBannerProps) {
  return (
    <TouchableOpacity
      style={styles.fixedSlotBanner}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.fixedSlotTitle}>Khung giờ cố định</Text>
        <Text style={styles.fixedSlotSubtitle}>
          Tạo hoặc quản lý khung giờ để giữ xe nhanh hơn.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </TouchableOpacity>
  );
}
