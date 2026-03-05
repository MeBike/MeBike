import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BikeColors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  timeText: {
    fontSize: 15,
    fontWeight: "500",
    color: BikeColors.textPrimary,
  },
});

type ReservationTimePickerProps = {
  formattedTime: string;
  onOpen: () => void;
};

export function ReservationTimePicker({
  formattedTime,
  onOpen,
}: ReservationTimePickerProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Thời gian giữ xe</Text>
      <TouchableOpacity
        style={styles.timePickerButton}
        onPress={onOpen}
        activeOpacity={0.9}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color={BikeColors.primary}
        />
        <Text style={styles.timeText}>{formattedTime}</Text>
      </TouchableOpacity>
    </View>
  );
}
