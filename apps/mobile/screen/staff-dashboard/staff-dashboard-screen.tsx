import type { StackNavigationProp } from "@react-navigation/stack";

import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback } from "react";
import { ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/types/navigation";

import { ToolTile } from "./components/tool-tile";
import { styles } from "./styles";

export default function StaffDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleScanQr = useCallback(() => {
    navigation.navigate("QRScanner");
  }, [navigation]);

  const handlePhoneLookup = useCallback(() => {
    navigation.navigate("StaffPhoneLookup");
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 32 }]}
        >
          <Text style={styles.headerTitle}>Công cụ nhân viên</Text>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Chức năng nhanh</Text>
          <View style={styles.toolsList}>
            <ToolTile
              icon="scan"
              title="Quét QR của khách"
              description="Hỗ trợ khách quét mã để bắt đầu hoặc kết thúc chuyến đi."
              onPress={handleScanQr}
            />
            <ToolTile
              icon="call"
              title="Tra cứu số điện thoại"
              description="Tìm phiên thuê đang hoạt động khi khách quên điện thoại hoặc không quét được mã."
              onPress={handlePhoneLookup}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
