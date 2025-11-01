import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { WALLET_CONSTANTS } from "../../../utils/wallet/constants";
import { styles } from "./styles";

type LoadingSpinnerProps = {
  message?: string;
  size?: "small" | "large";
  color?: string;
};

export function LoadingSpinner({ message = "Đang tải...", size = "large", color = WALLET_CONSTANTS.COLORS.PRIMARY }: LoadingSpinnerProps) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={[styles.message, { color }]}>{message}</Text>}
    </View>
  );
}
