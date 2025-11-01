import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { WALLET_CONSTANTS } from "../../../utils/wallet/constants";
import { styles } from "./styles";

type WalletActionsProps = {
  onTopUp: () => void;
  onWithdraw: () => void;
  // onRefund?: () => void;
};

export function WalletActions({ onTopUp, onWithdraw }: WalletActionsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onTopUp}>
        <LinearGradient
          colors={WALLET_CONSTANTS.GRADIENT_COLORS.TOP_UP}
          style={styles.gradient}
        >
          <Ionicons name="arrow-down" size={24} color="#fff" />
          <Text style={styles.buttonText}>Nạp tiền</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onWithdraw}>
        <LinearGradient
          colors={WALLET_CONSTANTS.GRADIENT_COLORS.WITHDRAW}
          style={styles.gradient}
        >
          <Ionicons name="arrow-up" size={24} color="#fff" />
          <Text style={styles.buttonText}>Rút tiền</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.button} onPress={onRefund}>
        <LinearGradient
          colors={WALLET_CONSTANTS.GRADIENT_COLORS.REFUND}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Ionicons name="swap-horizontal" size={24} color="#fff" />
          <Text style={styles.buttonText}>Hoàn tiền</Text>
        </LinearGradient>
      </TouchableOpacity> */}
    </View>
  );
}
