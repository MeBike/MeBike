import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

import { WALLET_CONSTANTS } from "../../../utils/wallet/constants";
import { formatBalance, formatWalletStatus } from "../../../utils/wallet/formatters";
import { styles } from "./styles";

type WalletBalanceProps = {
  balance: string;
  availableBalance: string;
  reservedBalance: string;
  status: string;
};

export function WalletBalance({
  balance,
  availableBalance,
  reservedBalance,
  status,
}: WalletBalanceProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ví của tôi</Text>
      <Text style={styles.balanceLabel}>Số dư tổng</Text>

      <View style={styles.balanceRow}>
        <Text style={styles.balanceAmount}>
          {formatBalance(balance)}
          {" "}
          đ
        </Text>
        <Ionicons
          name="wallet-outline"
          size={34}
          color="rgba(255,255,255,0.16)"
          style={styles.walletIcon}
        />
      </View>

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
        <Text style={styles.statusText}>{formatWalletStatus(status)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Khả dụng</Text>
          <Text style={styles.summaryValue}>
            {formatBalance(availableBalance)}
            {" "}
            đ
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Đang tạm giữ</Text>
          <Text style={styles.summaryValue}>
            {formatBalance(reservedBalance)}
            {" "}
            đ
          </Text>
        </View>
      </View>
    </View>
  );
}
