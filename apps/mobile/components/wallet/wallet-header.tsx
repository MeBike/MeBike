import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { walletHeaderStyles as styles } from "../../styles/wallet/walletHeader";

export function WalletHeader() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.backButton, { top: insets.top + 8 }]}
      onPress={() => navigation.goBack()}
      activeOpacity={0.7}
    >
      <Ionicons name="chevron-back" size={20} color="#fff" />
    </TouchableOpacity>
  );
}

export function WalletSettings() {
  const insets = useSafeAreaInsets();
  const handleSettings = () => {
    Alert.alert("Cài đặt ví đang phát triển!");
  };

  return (
    <TouchableOpacity
      style={[styles.settingsButton, { top: insets.top + 8 }]}
      onPress={handleSettings}
      activeOpacity={0.7}
    >
      <Ionicons name="settings-outline" size={24} color="#fff" />
    </TouchableOpacity>
  );
}
