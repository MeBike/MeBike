import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetStationLookupQuery } from "@hooks/query/Reservation/useGetStationLookupQuery";
import { useReservationActions } from "@hooks/useReservationActions";
import { useAuth } from "@providers/auth-providers";

import type {
  ReservationDetailNavigationProp,
  ReservationDetailRouteProp,
} from "../types/navigation";
import type { Reservation } from "../types/ReservationTypes";

const statusColorMap: Record<Reservation["status"], string> = {
  "ĐANG CHỜ XỬ LÍ": "#FFB020",
  "ĐANG HOẠT ĐỘNG": "#4CAF50",
  "ĐÃ HUỶ": "#F44336",
  "ĐÃ HẾT HẠN": "#9E9E9E",
};

function formatDateTime(value?: string | null) {
  if (!value)
    return "Không có dữ liệu";
  const date = new Date(value);
  return `${date.toLocaleDateString("vi-VN")}, ${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatCurrency(
  value?: number | string | { $numberDecimal?: string },
) {
  if (value === null || value === undefined)
    return "0 đ";
  let amount = 0;
  if (typeof value === "number") {
    amount = value;
  }
  else if (typeof value === "string") {
    const parsed = Number(value);
    amount = Number.isFinite(parsed) ? parsed : 0;
  }
  else if (typeof value === "object" && "$numberDecimal" in value) {
    const parsed = Number(value.$numberDecimal);
    amount = Number.isFinite(parsed) ? parsed : 0;
  }
  if (!Number.isFinite(amount))
    amount = 0;
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function ReservationDetailScreen() {
  const navigation = useNavigation<ReservationDetailNavigationProp>();
  const route = useRoute<ReservationDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const hasToken = Boolean(user?._id);

  const { reservationId, reservation: initialReservation } = route.params;

  const {
    reservationDetail,
    fetchReservationDetail,
    isReservationDetailLoading,
    confirmReservation,
    cancelReservation,
    isConfirmingReservation,
    isCancellingReservation,
  } = useReservationActions({
    hasToken,
    reservationId,
    enableDetailQuery: !initialReservation,
  });

  const stationIdForLookup
    = reservationDetail?.station_id ?? initialReservation?.station_id;

  const { data: stationLookup } = useGetStationLookupQuery(
    stationIdForLookup,
    Boolean(stationIdForLookup) && !(initialReservation?.station || reservationDetail?.station),
  );

  const reservation: Reservation | undefined = useMemo(() => {
    return reservationDetail ?? initialReservation;
  }, [initialReservation, reservationDetail]);

  const resolvedStation = useMemo(() => {
    if (!reservation)
      return undefined;
    if (reservation.station)
      return reservation.station;
    if (stationLookup) {
      return {
        _id: stationLookup._id,
        name: stationLookup.name,
        address: stationLookup.address,
      };
    }
    return undefined;
  }, [reservation, stationLookup]);

  useEffect(() => {
    if (!initialReservation) {
      fetchReservationDetail();
    }
  }, [fetchReservationDetail, initialReservation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleConfirm = useCallback(() => {
    if (!reservation)
      return;
    Alert.alert(
      "Xác nhận bắt đầu",
      "Bạn chắc chắn muốn bắt đầu chuyến đi với lượt đặt trước này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bắt đầu",
          onPress: () =>
            confirmReservation(reservationId, {
              onSuccess: () => {
                fetchReservationDetail();
                navigation.replace("BookingHistoryDetail", { bookingId: reservationId });
              },
            }),
        },
      ],
    );
  }, [confirmReservation, fetchReservationDetail, reservation, reservationId]);

  const handleCancel = useCallback(() => {
    if (!reservation)
      return;
    Alert.alert(
      "Huỷ đặt trước",
      "Bạn có chắc chắn muốn huỷ lượt đặt trước này không?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Huỷ đặt",
          style: "destructive",
          onPress: () =>
            cancelReservation(reservationId, undefined, {
              onSuccess: () => {
                fetchReservationDetail();
                navigation.goBack();
              },
            }),
        },
      ],
    );
  }, [cancelReservation, fetchReservationDetail, reservation, reservationId]);

  if (!reservation && isReservationDetailLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Đang tải chi tiết đặt trước...</Text>
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorTitle}>Không tìm thấy dữ liệu</Text>
        <Text style={styles.errorMessage}>
          Lượt đặt trước này có thể đã bị xoá hoặc không tồn tại.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPending = reservation.status === "ĐANG CHỜ XỬ LÍ";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity style={styles.headerBack} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đặt trước</Text>
        <Text style={styles.headerSubtitle}>
          Kiểm tra thông tin và bắt đầu chuyến đi của bạn.
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bicycle" size={24} color="#0066FF" />
            <View style={styles.headerContent}>
              <View style={styles.headerTopRow}>
                <Text style={styles.cardTitle}>
                  Xe #
                  {String(reservation.bike_id ?? "").slice(-4) || reservation.bike_id}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColorMap[reservation.status] ?? "#0066FF" },
                  ]}
                >
                  <Text style={styles.statusText}>{reservation.status}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>
                Mã đặt:
                {reservation._id}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#607D8B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thời gian giữ chỗ</Text>
              <Text style={styles.infoValue}>{formatDateTime(reservation.start_time)}</Text>
              <Text style={styles.infoValueSecondary}>
                Hiệu lực đến
                {" "}
                {formatDateTime(reservation.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="navigate" size={20} color="#607D8B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Trạm lấy xe</Text>
              <Text style={styles.infoValue}>
                {resolvedStation?.name ?? "Không xác định"}
              </Text>
              {resolvedStation?.address
                ? (
                    <Text style={styles.infoValueSecondary}>{resolvedStation.address}</Text>
                  )
                : null}
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="wallet" size={20} color="#607D8B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số tiền đã thanh toán</Text>
              <Text style={styles.infoValue}>{formatCurrency(reservation.prepaid)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={20} color="#607D8B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tạo lúc</Text>
              <Text style={styles.infoValue}>{formatDateTime(reservation.created_at)}</Text>
              <Text style={styles.infoValueSecondary}>
                Cập nhật gần nhất
                {" "}
                {formatDateTime(reservation.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, !isPending && styles.disabledButton]}
            onPress={handleCancel}
            disabled={!isPending || isCancellingReservation}
          >
            {isCancellingReservation
              ? (
                  <ActivityIndicator size="small" color="#fff" />
                )
              : (
                  <>
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={styles.actionText}>Huỷ đặt trước</Text>
                  </>
                )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton, !isPending && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={!isPending || isConfirmingReservation}
          >
            {isConfirmingReservation
              ? (
                  <ActivityIndicator size="small" color="#fff" />
                )
              : (
                  <>
                    <Ionicons name="play" size={18} color="#fff" />
                    <Text style={styles.actionText}>Xác nhận & bắt đầu</Text>
                  </>
                )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#607D8B",
  },
  headerContent: {
    flex: 1,
    flexDirection: "column",
    gap: 6,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    maxWidth: "70%",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },
  separator: {
    marginVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#90A4AE",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#90A4AE",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 15,
    color: "#263238",
    fontWeight: "600",
  },
  infoValueSecondary: {
    marginTop: 4,
    fontSize: 13,
    color: "#607D8B",
  },
  actionsContainer: {
    flexDirection: "column",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: "#F44336",
  },
  confirmButton: {
    backgroundColor: "#0066FF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#607D8B",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#263238",
  },
  errorMessage: {
    fontSize: 14,
    color: "#607D8B",
    textAlign: "center",
  },
  backButton: {
    marginTop: 8,
    backgroundColor: "#0066FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default ReservationDetailScreen;
