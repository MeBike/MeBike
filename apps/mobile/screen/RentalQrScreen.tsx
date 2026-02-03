import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

import { useAuthNext } from "@providers/auth-provider-next";
import { rentalService } from "@services/rental.service";

import type { RentalDetail } from "../types/RentalTypes";

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
  completedCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginVertical: 24,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F6BFF",
    marginTop: 16,
  },
  completedSubtitle: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#4B587A",
    lineHeight: 20,
  },
  secondaryAction: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#0066FF",
  },
  secondaryActionText: {
    color: "#0066FF",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  loadingText: {
    color: "#1F3A6F",
    fontSize: 13,
  },
});

function RentalQrScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as RouteParams;
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthNext();
  const hasToken = isAuthenticated;

  const {
    data: rentalDetailResponse,
    isLoading: isRentalLoading,
    refetch: refetchRentalDetail,
    isRefetching,
  } = useQuery({
    queryKey: ["rentals", "detail", bookingId],
    queryFn: () => rentalService.userGetRentalById(bookingId),
    enabled: hasToken && Boolean(bookingId),
  });

  const rentalDetail = rentalDetailResponse?.data?.result as RentalDetail | undefined;
  const bikeId = rentalDetail?.bike?._id;

  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  useEffect(() => {
    if (rentalDetail?.status === "HOÀN THÀNH") {
      setIsSessionCompleted(true);
    }
  }, [rentalDetail?.status]);


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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchRentalDetail}
            tintColor="#0066FF"
            colors={["#0066FF"]}
          />
        }
      >
        {isRentalLoading && !rentalDetail && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#0066FF" />
            <Text style={styles.loadingText}>Đang tải thông tin chuyến đi...</Text>
          </View>
        )}

        <LinearGradient
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>
            {isSessionCompleted ? "Hoàn tất trả xe" : "Đưa mã cho nhân viên"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isSessionCompleted
              ? "Nhân viên đã xác nhận kết thúc phiên thuê. Cảm ơn bạn đã sử dụng MeBike!"
              : "Nhân viên tại trạm sẽ quét mã này và kết thúc phiên thuê giúp bạn. Hãy giữ màn hình sáng trong quá trình quét."}
          </Text>
        </LinearGradient>

        <View style={[styles.qrCard, isSessionCompleted && styles.completedCard]}>
          <View style={styles.qrBadge}>
            <Ionicons name={isSessionCompleted ? "checkmark-circle" : "bicycle"} size={14} color="#0F6BFF" />
            <Text style={styles.qrBadgeText}>
              {isSessionCompleted ? "ĐÃ TRẢ XE" : "MÃ THUÊ"}
            </Text>
          </View>
          {isSessionCompleted ? (
            <>
              <Ionicons name="checkmark-circle" size={120} color="#10B981" />
              <Text style={styles.completedTitle}>Phiên thuê đã kết thúc</Text>
              <Text style={styles.completedSubtitle}>
                Bạn có thể đóng màn hình hoặc xem lại chi tiết chuyến đi.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { width: "100%", marginTop: 24 }]}
                onPress={() =>
                  (navigation as any).navigate("BookingHistoryDetail", { bookingId })}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Chi tiết chuyến đi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryActionText}>Quay lại</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <QRCode
                value={bookingId}
                size={240}
                backgroundColor="transparent"
                color="#111"
              />
              <Text style={styles.qrValue}>{bookingId}</Text>
            </>
          )}
        </View>

        {!isSessionCompleted && (
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
        )}
      </ScrollView>
    </View>
  );
}

export default RentalQrScreen;
