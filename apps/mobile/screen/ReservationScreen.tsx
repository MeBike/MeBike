import { Ionicons } from "@expo/vector-icons";
import { useReservationActions } from "@hooks/useReservationActions";
import { useStationActions } from "@hooks/useStationAction";
import { useAuth } from "@providers/auth-providers";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ReservationsScreenNavigationProp } from "../types/navigation";
import type { Reservation } from "../types/ReservationTypes";

const statusColorMap: Record<Reservation["status"], string> = {
  "ĐANG CHỜ XỬ LÍ": "#FFB020",
  "ĐANG HOẠT ĐỘNG": "#4CAF50",
  "ĐÃ HUỶ": "#F44336",
  "ĐÃ HẾT HẠN": "#9E9E9E",
};

const SERVER_TIME_OFFSET_MS = 7 * 60 * 60 * 1000;

function formatDateTime(value?: string | null) {
  if (!value)
    return "Không có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return "Không có dữ liệu";

  const compensatedDate = new Date(date.getTime() - SERVER_TIME_OFFSET_MS);

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(compensatedDate);
}

function formatCurrency(value?: number | string | { $numberDecimal?: string }) {
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

function ReservationScreen() {
  const navigation = useNavigation<ReservationsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const hasToken = Boolean(user?._id);

  const {
    pendingReservations,
    reservationHistory,
    isPendingReservationsLoading,
    isReservationHistoryLoading,
    isPendingReservationsFetching,
    isReservationHistoryFetching,
    fetchPendingReservations,
    fetchReservationHistory,
  } = useReservationActions({ hasToken });

  const { stations, getAllStations } = useStationActions(hasToken);

  useEffect(() => {
    if (hasToken) {
      getAllStations();
    }
  }, [hasToken, getAllStations]);

  const stationMap = useMemo(() => {
    const map = new Map<string, { name: string; address?: string }>();
    (stations || []).forEach((station) => {
      map.set(station._id, { name: station.name, address: station.address });
    });
    return map;
  }, [stations]);

  const [refreshing, setRefreshing] = useState(false);

  const isLoading
    = isPendingReservationsLoading || isReservationHistoryLoading;
  const isFetching
    = isPendingReservationsFetching || isReservationHistoryFetching;

  const hasLoadedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasToken) {
        return;
      }

      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true;
        return;
      }

      fetchPendingReservations();
      fetchReservationHistory();
      getAllStations();
    }, [hasToken, fetchPendingReservations, fetchReservationHistory, getAllStations]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPendingReservations(),
      fetchReservationHistory(),
      getAllStations(),
    ]);
    setRefreshing(false);
  }, [fetchPendingReservations, fetchReservationHistory, getAllStations]);

  const sections = useMemo(
    () => [
      {
        title: "Đang chờ xử lí",
        description: "Theo dõi các lượt đặt trước sắp diễn ra.",
        data: pendingReservations,
        emptyText: "Bạn chưa có lượt đặt trước nào.",
      },
      {
        title: "Lịch sử đặt trước",
        description: "Xem lại các đặt trước đã hoàn thành hoặc đã hủy.",
        data: reservationHistory,
        emptyText: "Chưa có lịch sử đặt trước.",
      },
    ],
    [pendingReservations, reservationHistory],
  );

  const handleNavigateToDetail = (reservation: Reservation) => {
    const stationEntry = stationMap.get(reservation.station_id);
    const stationInfo
      = reservation.station
        ?? (stationEntry
          ? {
              _id: reservation.station_id,
              name: stationEntry.name,
              address: stationEntry.address ?? "",
            }
          : undefined);

    navigation.navigate("ReservationDetail", {
      reservationId: reservation._id,
      reservation: {
        ...reservation,
        station: stationInfo,
      },
    });
  };

  const renderReservationCard = (reservation: Reservation) => (
    <TouchableOpacity
      key={reservation._id}
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => handleNavigateToDetail(reservation)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="bicycle" size={22} color="#0066FF" />
          <View style={styles.cardTitleContent}>
            <Text style={styles.cardTitle}>
              Xe #
              {String(reservation.bike_id ?? "").slice(-4) || reservation.bike_id}
            </Text>
            <Text style={styles.cardSubtitle}>
              Bắt đầu:
              {" "}
              {formatDateTime(reservation.start_time)}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColorMap[reservation.status] ?? "#0066FF" },
          ]}
        >
          <Text style={styles.statusText}>{reservation.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Ionicons name="navigate" size={18} color="#666" />
          <Text style={styles.detailText}>
            Trạm:
            {" "}
            {stationMap.get(reservation.station_id)?.name ?? reservation.station?.name ?? `Mã ${String(reservation.station_id ?? "").slice(-6)}`}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={18} color="#666" />
          <Text style={styles.detailText}>
            Giữ chỗ đến:
            {" "}
            {formatDateTime(reservation.end_time)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="wallet" size={18} color="#0066FF" />
          <Text style={[styles.detailText, styles.detailHighlight]}>
            Đã thanh toán:
            {" "}
            {formatCurrency(reservation.prepaid)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Xem chi tiết</Text>
        <Ionicons name="chevron-forward" size={18} color="#0066FF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Đặt trước của tôi</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý các lượt đặt trước và bắt đầu chuyến đi nhanh chóng.
        </Text>
      </LinearGradient>

      {isLoading && !refreshing
        ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066FF" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          )
        : (
            <ScrollView
              style={styles.content}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0066FF"]} />
              }
            >
              {isFetching && (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator size="small" color="#0066FF" />
                  <Text style={styles.inlineLoaderText}>Đang cập nhật...</Text>
                </View>
              )}
              {sections.map(section => (
                <View key={section.title} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionSubtitle}>{section.description}</Text>
                  </View>
                  {section.data.length > 0
                    ? (
                        section.data.map(renderReservationCard)
                      )
                    : (
                        <View style={styles.emptyState}>
                          <Ionicons name="document-text-outline" size={40} color="#B0BEC5" />
                          <Text style={styles.emptyText}>{section.emptyText}</Text>
                        </View>
                      )}
                </View>
              ))}
            </ScrollView>
          )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#607D8B",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitleContent: {
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#263238",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#607D8B",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: "70%",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },
  cardBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECEFF1",
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#455A64",
  },
  detailHighlight: {
    fontWeight: "600",
    color: "#0066FF",
  },
  cardFooter: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0066FF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#90A4AE",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#607D8B",
  },
  inlineLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  inlineLoaderText: {
    fontSize: 13,
    color: "#607D8B",
  },
});

export default ReservationScreen;
