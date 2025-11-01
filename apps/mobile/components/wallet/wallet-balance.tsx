import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

import { walletBalanceStyles as styles } from "../../styles/wallet/walletBalance";
import { WALLET_CONSTANTS } from "../../utils/wallet/constants";
import { formatBalance } from "../../utils/wallet/formatters";

type WalletBalanceProps = {
  balance: string;
  status: string;
};

export function WalletBalance({ balance, status }: WalletBalanceProps) {
  return (
    <LinearGradient
      style={styles.gradient}
      colors={WALLET_CONSTANTS.GRADIENT_COLORS.BALANCE}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ví của tôi</Text>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceContent}>
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceAmount}>
            {formatBalance(balance)}
            {" "}
            đ
          </Text>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    status === WALLET_CONSTANTS.STATUS.ACTIVE
                      ? WALLET_CONSTANTS.COLORS.SUCCESS
                      : WALLET_CONSTANTS.COLORS.DANGER,
                },
              ]}
            />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        <Ionicons
          name="wallet-outline"
          size={56}
          color="rgba(255,255,255,0.16)"
          style={styles.walletIcon}
        />
      </View>
    </LinearGradient>
  );
}
