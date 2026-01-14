import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";

import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import { useGetBikeByIDAllQuery } from "@hooks/query/Bike/use-get-bike-by-id-query";
import { useGetSubscriptionsQuery } from "@hooks/query/Subscription/useGetSubscriptionsQuery";
import { useRentalsActions } from "@hooks/useRentalAction";
import { useReservationActions } from "@hooks/useReservationActions";
import { useWalletActions } from "@hooks/useWalletAction";
import { useAuth } from "@providers/auth-providers";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { formatVietnamDateTime } from "@utils/date";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Bike } from "../types/BikeTypes";
import type { BikeDetailNavigationProp } from "../types/navigation";
import type { Reservation } from "../types/reservation-types";

import BookingDetailHeader from "./booking-history-detail/components/BookingDetailHeader";

type RouteParams = {
  bike: Bike;
  station: {
    id: string;
    name: string;
    address: string;
  };
};

type PaymentMode = "wallet" | "subscription";

const BIKE_STATUS_COLORS: Record<Bike["status"], string> = {
  "CÓ SẴN": "#4CAF50",
  "ĐANG ĐƯỢC THUÊ": "#FF9800",
  "BỊ HỎNG": "#F44336",
  "ĐÃ ĐẶT TRƯỚC": "#FF9800",
  "ĐANG BẢO TRÌ": "#F44336",
  "KHÔNG CÓ SẴN": "#999999",
};

function getBikeStatusColor(status: Bike["status"]) {
  return BIKE_STATUS_COLORS[status] ?? "#999999";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: BikeColors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  bikeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BikeColors.onSurface,
  },
  bikeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.onSurface,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  infoLabel: {
    color: BikeColors.onSurfaceVariant,
  },
  infoValue: {
    fontWeight: "600",
    color: BikeColors.onSurface,
  },
  reservationCard: {
    borderLeftWidth: 4,
    borderLeftColor: BikeColors.primary,
    paddingLeft: 12,
  },
  paymentToggle: {
    flexDirection: "row",
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BikeColors.primary,
    backgroundColor: BikeColors.surface,
  },
  paymentButtonDisabled: {
    opacity: 0.5,
  },
  paymentButtonActive: {
    backgroundColor: "#E8F1FF",
  },
  paymentButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: BikeColors.primary,
  },
  paymentButtonHint: {
    marginTop: 4,
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
  },
  subscriptionList: {
    gap: 12,
  },
  subscriptionCard: {
    borderWidth: 1,
    borderColor: BikeColors.divider,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subscriptionCardActive: {
    borderColor: BikeColors.primary,
    backgroundColor: "#E8F1FF",
  },
  helperText: {
    fontSize: 13,
    color: BikeColors.onSurfaceVariant,
  },
  linkText: {
    color: BikeColors.primary,
    fontWeight: "600",
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: "700",
    color: BikeColors.onSurface,
    marginTop: 4,
  },
  footer: {
    padding: 16,
    gap: 12,
    backgroundColor: BikeColors.surface,
  },
  primaryButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: BikeColors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: BikeColors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: BikeColors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  emptyState: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF6E5",
    borderWidth: 1,
    borderColor: "#FFD9A1",
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
});

function BikeDetailScreen() {
  const navigation = useNavigation<BikeDetailNavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { bike, station } = route.params as RouteParams;
  const hasToken = Boolean(user?._id);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("wallet");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);

  const { postRent, isPostRentLoading } = useRentalsActions(
    hasToken,
    bike._id,
    station.id,
  );
  const { myWallet, getMyWallet } = useWalletActions(hasToken);
  const {
    data: subscriptionResponse,
    refetch: refetchSubscriptions,
  } = useGetSubscriptionsQuery(
    { status: "ĐANG HOẠT ĐỘNG" },
    hasToken,
  );
  const {
    pendingReservations,
  } = useReservationActions({
    hasToken,
    autoFetch: hasToken,
    pendingLimit: 5,
  });
  const {
    data: bikeDetailResponse,
    refetch: refetchBikeDetail,
    isFetching: isFetchingBikeDetail,
  } = useGetBikeByIDAllQuery(bike._id);

  useEffect(() => {
    if (hasToken) {
      getMyWallet();
    }
  }, [getMyWallet, hasToken]);

  useFocusEffect(
    useCallback(() => {
      refetchBikeDetail();
      if (hasToken) {
        refetchSubscriptions();
      }
    }, [hasToken, refetchBikeDetail, refetchSubscriptions]),
  );

  const activeSubscriptions = useMemo(
    () => subscriptionResponse?.data ?? [],
    [subscriptionResponse],
  );

  const canUseSubscription = activeSubscriptions.length > 0;
  const currentBike: Bike = bikeDetailResponse ?? bike;
  const isBikeAvailable = currentBike.status === "CÓ SẴN";

  useEffect(() => {
    if (!canUseSubscription) {
      setPaymentMode("wallet");
      setSelectedSubscriptionId(null);
      return;
    }
    if (paymentMode === "subscription") {
      const stillValid = activeSubscriptions.some(subscription => subscription._id === selectedSubscriptionId);
      if (!stillValid) {
        setSelectedSubscriptionId(activeSubscriptions[0]?._id ?? null);
      }
    }
  }, [activeSubscriptions, canUseSubscription, paymentMode]);

  const walletBalance = myWallet
    ? Number(myWallet.balance.$numberDecimal || 0)
    : null;

  const currentReservation: Reservation | undefined = useMemo(
    () =>
      pendingReservations.find(reservation => reservation.bike_id === currentBike._id),
    [pendingReservations, currentBike._id],
  );

  const ensureAuthenticated = useCallback(() => {
    if (!hasToken) {
      navigation.navigate("Login");
      return false;
    }
    if (user?.verify === "UNVERIFIED") {
      Alert.alert("Tài khoản chưa xác thực", "Vui lòng xác thực tài khoản để tiếp tục.");
      return false;
    }
    return true;
  }, [hasToken, navigation, user]);

  const handleSelectPaymentMode = useCallback(
    (mode: PaymentMode) => {
      if (mode === "subscription" && !canUseSubscription) {
        Alert.alert(
          "Chưa có gói tháng",
          "Bạn cần đăng ký gói tháng trước khi sử dụng hình thức này.",
          [
            { text: "Để sau", style: "cancel" },
            {
              text: "Xem gói tháng",
              onPress: () => navigation.navigate("Subscriptions"),
            },
          ],
        );
        return;
      }
      setPaymentMode(mode);
    },
    [canUseSubscription, navigation],
  );

  const handleReserve = useCallback(() => {
    if (currentBike.status !== "CÓ SẴN") {
      Alert.alert("Xe không khả dụng", "Vui lòng chọn một xe khác.");
      return;
    }
    if (!ensureAuthenticated())
      return;

    const bikeLabel = currentBike.chip_id
      ? `Chip #${currentBike.chip_id}`
      : `#${currentBike._id.slice(-4)}`;

    const reservationMode: ReservationMode = paymentMode === "subscription" ? "GÓI THÁNG" : "MỘT LẦN";
    const subscriptionForReservation = paymentMode === "subscription"
      ? selectedSubscriptionId ?? activeSubscriptions[0]?._id ?? undefined
      : undefined;

    navigation.navigate("ReservationFlow", {
      stationId: station.id,
      stationName: station.name,
      stationAddress: station.address,
      bikeId: currentBike._id,
      bikeName: bikeLabel,
      initialMode: reservationMode,
      initialSubscriptionId: subscriptionForReservation,
      lockPaymentSelection: true,
    });
  }, [
    activeSubscriptions,
    currentBike,
    ensureAuthenticated,
    navigation,
    paymentMode,
    selectedSubscriptionId,
    station,
  ]);

  const handleBookNow = useCallback(() => {
    if (currentBike.status !== "CÓ SẴN") {
      Alert.alert("Xe không khả dụng", "Vui lòng chọn xe khác.");
      return;
    }
    if (!ensureAuthenticated())
      return;

    if (paymentMode === "subscription" && activeSubscriptions.length === 0) {
      Alert.alert(
        "Chưa có gói tháng",
        "Bạn cần đăng ký gói tháng trước khi sử dụng hình thức này.",
        [
          { text: "Để sau", style: "cancel" },
          {
            text: "Xem gói tháng",
            onPress: () => navigation.navigate("Subscriptions"),
          },
        ],
      );
      return;
    }

    const payload: { bike_id: string; subscription_id?: string } = {
      bike_id: currentBike._id,
    };
    if (paymentMode === "subscription") {
      if (!selectedSubscriptionId) {
        Alert.alert("Chọn gói tháng", "Vui lòng chọn một gói tháng để tiếp tục.");
        return;
      }
      payload.subscription_id = selectedSubscriptionId;
    }

    postRent(payload, {
      onSuccess: () => {
        refetchBikeDetail();
      },
    });
  }, [
    activeSubscriptions.length,
    currentBike._id,
    ensureAuthenticated,
    navigation,
    paymentMode,
    postRent,
    refetchBikeDetail,
    selectedSubscriptionId,
  ]);

  const statusColor = getBikeStatusColor(currentBike.status);
  const isPrimaryDisabled = isPostRentLoading || !isBikeAvailable;
  const isReserveDisabled = !isBikeAvailable;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <BookingDetailHeader
        title="Chi tiết xe"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.bikeTitle}>
            {currentBike.chip_id ? `Chip #${currentBike.chip_id}` : `Xe #${currentBike._id.slice(-4)}`}
          </Text>
          <View style={styles.bikeMetaRow}>
            <Text
              style={[
                styles.badge,
                { backgroundColor: statusColor, color: "#fff" },
              ]}
            >
              {currentBike.status}
            </Text>
            <Text style={styles.helperText}>{station.name}</Text>
          </View>
          <View style={{ marginTop: 16, gap: 10 }}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nhà cung cấp</Text>
              <Text style={styles.infoValue}>{currentBike.supplier_id ?? "Chưa cập nhật"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày tạo</Text>
              <Text style={styles.infoValue}>
                {formatVietnamDateTime(currentBike.created_at)}
              </Text>
            </View>
          </View>
          {isFetchingBikeDetail && (
            <View style={styles.refreshRow}>
              <ActivityIndicator size="small" color={BikeColors.primary} />
              <Text style={styles.helperText}>Đang cập nhật trạng thái...</Text>
            </View>
          )}
        </View>

        {currentReservation && (
          <View style={[styles.card, styles.reservationCard]}>
            <Text style={styles.sectionTitle}>Bạn đang giữ xe này</Text>
            <Text style={styles.helperText}>
              Bắt đầu lúc
              {" "}
              {formatVietnamDateTime(currentReservation.start_time)}
            </Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 12 }]}
              onPress={() =>
                navigation.navigate("ReservationDetail", {
                  reservationId: currentReservation._id,
                  reservation: currentReservation,
                })}
            >
              <Text style={styles.secondaryButtonText}>Xem chi tiết giữ xe</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentToggle}>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                paymentMode === "wallet" && styles.paymentButtonActive,
              ]}
              onPress={() => handleSelectPaymentMode("wallet")}
              activeOpacity={0.9}
            >
              <Text style={styles.paymentButtonLabel}>Ví MeBike</Text>
              <Text style={styles.paymentButtonHint}>
                Thanh toán bằng số dư hiện có
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                paymentMode === "subscription" && styles.paymentButtonActive,
                !canUseSubscription && styles.paymentButtonDisabled,
              ]}
              onPress={() => handleSelectPaymentMode("subscription")}
              disabled={!canUseSubscription}
              activeOpacity={0.9}
            >
              <Text style={styles.paymentButtonLabel}>Gói tháng</Text>
              <Text style={styles.paymentButtonHint}>
                {canUseSubscription ? "Sử dụng gói đã đăng ký" : "Chưa có gói hoạt động"}
              </Text>
            </TouchableOpacity>
          </View>

          {paymentMode === "wallet" && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.helperText}>Số dư khả dụng</Text>
              <Text style={styles.walletBalance}>
                {walletBalance != null
                  ? `${walletBalance.toLocaleString("vi-VN")} đ`
                  : "--"}
              </Text>
            </View>
          )}

          {paymentMode === "subscription" && (
            <View style={{ marginTop: 16, gap: 12 }}>
              {activeSubscriptions.length === 0
                ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.helperText}>
                        Bạn chưa có gói tháng hoạt động.
                        {" "}
                        <Text
                          style={styles.linkText}
                          onPress={() => navigation.navigate("Subscriptions")}
                        >
                          Đăng ký ngay
                        </Text>
                      </Text>
                    </View>
                  )
                : (
                    <View style={styles.subscriptionList}>
                      {activeSubscriptions.map((subscription) => {
                        const remaining = subscription.max_usages != null
                          ? Math.max(0, subscription.max_usages - subscription.usage_count)
                          : null;
                        const isActive = subscription._id === selectedSubscriptionId;
                        return (
                          <TouchableOpacity
                            key={subscription._id}
                            style={[
                              styles.subscriptionCard,
                              isActive && styles.subscriptionCardActive,
                            ]}
                            onPress={() => setSelectedSubscriptionId(subscription._id)}
                            activeOpacity={0.9}
                          >
                            <View>
                              <Text style={styles.infoValue}>
                                {subscription.package_name.toUpperCase()}
                              </Text>
                              <Text style={styles.helperText}>
                                {remaining != null
                                  ? `${remaining} / ${subscription.max_usages} lượt`
                                  : "Không giới hạn"}
                              </Text>
                            </View>
                            <Ionicons
                              name={isActive ? "checkmark-circle" : "ellipse-outline"}
                              size={22}
                              color={BikeColors.primary}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!isBikeAvailable && (
          <Text style={[styles.helperText, { textAlign: "center" }]}>
            Xe đang bận, vui lòng chọn xe khác hoặc thử lại sau.
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            isPrimaryDisabled && styles.primaryButtonDisabled,
          ]}
          onPress={handleBookNow}
          disabled={isPrimaryDisabled}
        >
          {isPostRentLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryButtonText}>Thuê ngay</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            isReserveDisabled && styles.primaryButtonDisabled,
          ]}
          onPress={handleReserve}
          disabled={isReserveDisabled}
        >
          <Text style={styles.secondaryButtonText}>Đặt trước</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default BikeDetailScreen;
