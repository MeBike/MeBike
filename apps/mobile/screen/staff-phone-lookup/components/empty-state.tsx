import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

import { styles } from "../styles";

export function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={48} color="#CBD5F5" />
      <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
      <Text style={styles.emptySubtitle}>
        Nhập số điện thoại của khách để kiểm tra phiên thuê đang hoạt động.
      </Text>
    </View>
  );
}
