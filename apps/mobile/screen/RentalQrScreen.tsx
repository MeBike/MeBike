import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

type RouteParams = {
  bookingId: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginVertical: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#F0F6FF",
    lineHeight: 22,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    alignItems: "center",
    marginBottom: 24,
  },
  qrBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E1F0FF",
    marginBottom: 16,
  },
  qrBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#0F6BFF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  qrValue: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "monospace",
    color: "#333",
  },
  instructionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F3A6F",
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  instructionIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0EDFF",
    color: "#0F6BFF",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: "#31456E",
    lineHeight: 20,
  },
  noteText: {
    marginTop: 18,
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#f5f5f5",
  },
  primaryButton: {
    backgroundColor: "#0066FF",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

function RentalQrScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as RouteParams;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trình mã QR</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>Đưa mã cho nhân viên</Text>
          <Text style={styles.heroSubtitle}>
            Nhân viên tại trạm sẽ quét mã này và kết thúc phiên thuê giúp bạn. Hãy giữ màn hình sáng trong quá trình quét.
          </Text>
        </LinearGradient>

        <View style={styles.qrCard}>
          <View style={styles.qrBadge}>
            <Ionicons name="bicycle" size={14} color="#0F6BFF" />
            <Text style={styles.qrBadgeText}>Mã thuê</Text>
          </View>
          <QRCode
            value={bookingId}
            size={240}
            backgroundColor="transparent"
            color="#111"
          />
          <Text style={styles.qrValue}>{bookingId}</Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Hướng dẫn kết thúc phiên</Text>
          {[
            "Đến quầy hoặc gặp nhân viên hỗ trợ của MeBike tại trạm.",
            "Nhấn “Trình mã QR” và đưa màn hình này cho họ quét.",
            "Giữ mở ứng dụng cho đến khi nhân viên xác nhận đã kết thúc phiên thuê.",
          ].map((text, index) => (
            <View key={text} style={styles.instructionItem}>
              <Text style={styles.instructionIndex}>{index + 1}</Text>
              <Text style={styles.instructionText}>{text}</Text>
            </View>
          ))}
          <Text style={styles.noteText}>
            Lưu ý: Mã QR chỉ hoạt động khi chuyến đi đang diễn ra. Không chia sẻ mã
            cho người lạ để tránh bị đóng phiên ngoài ý muốn.
          </Text>
        </View>
      </ScrollView>

     
    </View>
  );
}

export default RentalQrScreen;
