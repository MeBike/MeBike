import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { TabType } from "../../utils/wallet/constants";

import { walletTabsStyles as styles } from "../../styles/wallet/walletTabs";
import { TAB_TYPES } from "../../utils/wallet/constants";

type WalletTabsProps = {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
};

export function WalletTabs({ activeTab, onTabChange }: WalletTabsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === TAB_TYPES.TRANSACTIONS && styles.activeTab]}
        onPress={() => onTabChange(TAB_TYPES.TRANSACTIONS)}
      >
        <Text style={[styles.tabText, activeTab === TAB_TYPES.TRANSACTIONS && styles.activeTabText]}>
          Giao dịch
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === TAB_TYPES.WITHDRAWALS && styles.activeTab]}
        onPress={() => onTabChange(TAB_TYPES.WITHDRAWALS)}
      >
        <Text style={[styles.tabText, activeTab === TAB_TYPES.WITHDRAWALS && styles.activeTabText]}>
          Yêu cầu rút tiền
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === TAB_TYPES.REFUNDS && styles.activeTab]}
        onPress={() => onTabChange(TAB_TYPES.REFUNDS)}
      >
        <Text style={[styles.tabText, activeTab === TAB_TYPES.REFUNDS && styles.activeTabText]}>
          Yêu cầu hoàn tiền
        </Text>
      </TouchableOpacity>
    </View>
  );
}
