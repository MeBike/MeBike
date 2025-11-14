import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BikeColors } from "@constants/BikeColors";

type Props = {
  slotStart: string;
  onSelectTime: () => void;
};

export function TimeSelectionSection({ slotStart, onSelectTime }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Giờ bắt đầu</Text>
      <TouchableOpacity style={styles.selector} onPress={onSelectTime}>
        <Ionicons name="time-outline" size={18} color={BikeColors.primary} />
        <Text style={styles.selectorText}>{slotStart}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: BikeColors.textPrimary,
    marginBottom: 8,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BikeColors.divider,
    backgroundColor: "#fff",
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
});
