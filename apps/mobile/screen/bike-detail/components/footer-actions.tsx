import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { styles } from "../styles";

type Props = {
  isBikeAvailable: boolean;
  isPrimaryDisabled: boolean;
  isReserveDisabled: boolean;
  isPostRentLoading: boolean;
  onBookNow: () => void;
  onReserve: () => void;
  bottomInset: number;
};

export function FooterActions({
  isBikeAvailable,
  isPrimaryDisabled,
  isReserveDisabled,
  isPostRentLoading,
  onBookNow,
  onReserve,
  bottomInset,
}: Props) {
  return (
    <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
      {!isBikeAvailable
        ? (
            <Text style={[styles.helperText, { textAlign: "center" }]}>
              Xe đang bận, vui lòng chọn xe khác hoặc thử lại sau.
            </Text>
          )
        : null}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          isPrimaryDisabled && styles.primaryButtonDisabled,
        ]}
        onPress={onBookNow}
        disabled={isPrimaryDisabled}
      >
        {isPostRentLoading
          ? (
              <ActivityIndicator color="#fff" />
            )
          : (
              <Text style={styles.primaryButtonText}>Thuê ngay</Text>
            )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.secondaryButton,
          isReserveDisabled && styles.primaryButtonDisabled,
        ]}
        onPress={onReserve}
        disabled={isReserveDisabled}
      >
        <Text style={styles.secondaryButtonText}>Đặt trước</Text>
      </TouchableOpacity>
    </View>
  );
}
