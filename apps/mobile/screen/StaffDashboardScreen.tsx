import { Ionicons } from "@expo/vector-icons";
import { ScrollView } from "react-native";
import React from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { ScreenHeader } from "@components/ScreenHeader";
import { RootStackParamList } from "../types/navigation";

function StaffDashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleScanQr = () => {
    navigation.navigate("QRScanner");
  };

  const handlePhoneLookup = () => {
    navigation.navigate("StaffPhoneLookup");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Công cụ nhân viên"
          variant="centered"
          showBackButton={false}
        />

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Chức năng nhanh</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={handleScanQr}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="scan" size={24} color="#2563EB" />
              </View>
              <View style={styles.toolCopy}>
                <Text style={styles.toolButtonText}>Quét QR của khách</Text>
                <Text style={styles.toolButtonSubtext}>
                  Hỗ trợ khách quét mã để bắt đầu hoặc kết thúc chuyến đi.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={handlePhoneLookup}
            >
              <View style={[styles.iconCircle, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="call" size={20} color="#2563EB" />
              </View>
              <View style={styles.toolCopy}>
                <Text style={styles.toolButtonText}>Tra cứu số điện thoại</Text>
                <Text style={styles.toolButtonSubtext}>
                  Tìm phiên thuê đang hoạt động khi khách quên điện thoại hoặc
                  không quét được mã.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingBottom: 38,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 12,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  toolsGrid: {
    gap: 16,
  },
  toolButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  toolCopy: {
    flex: 1,
  },
  toolButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  toolButtonSubtext: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 13,
  },
});

export default StaffDashboardScreen;
