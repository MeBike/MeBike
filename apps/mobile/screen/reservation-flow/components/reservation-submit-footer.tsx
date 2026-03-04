import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";

import { BikeColors } from "@constants/BikeColors";

type ReservationSubmitFooterProps = {
  mode: ReservationMode;
  isSubmitting: boolean;
  onSubmit: () => void;
};

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: BikeColors.divider,
    backgroundColor: "#fff",
  },
  primaryButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export function ReservationSubmitFooter({
  mode,
  isSubmitting,
  onSubmit,
}: ReservationSubmitFooterProps) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
        onPress={onSubmit}
        disabled={isSubmitting}
        activeOpacity={0.9}
      >
        {isSubmitting
          ? (
              <ActivityIndicator color="#fff" />
            )
          : (
              <Text style={styles.primaryButtonText}>
                {mode === "GÓI THÁNG" ? "Dùng gói tháng" : "Đặt 1 lần"}
              </Text>
            )}
      </TouchableOpacity>
    </View>
  );
}
