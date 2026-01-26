import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";

import { useGetSubscriptionsQuery } from "@hooks/query/Subscription/useGetSubscriptionsQuery";
import { useRentalsActions } from "@hooks/useRentalAction";
import { useReservationActions } from "@hooks/useReservationActions";
import { useWalletActions } from "@hooks/useWalletAction";
import { useAuth } from "@providers/auth-providers";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useCallback, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PaymentMode } from "@/screen/bike-detail/hooks/use-bike-payment-selection";

import { useBikeDetailQuery } from "@/screen/bike-detail/hooks/use-bike-detail-query";
import { useBikePaymentSelection } from "@/screen/bike-detail/hooks/use-bike-payment-selection";

import type { Bike } from "../../../types/BikeTypes";
import type { BikeDetailNavigationProp } from "../../../types/navigation";
import type { Reservation } from "../../../types/reservation-types";

type RouteParams = {
  bike: Bike;
  station: {
    id: string;
    name: string;
    address: string;
  };
};

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

export function useBikeDetail() {
  const navigation = useNavigation<BikeDetailNavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { bike, station } = route.params as RouteParams;
  const hasToken = Boolean(user?.id);

  const { postRent, isPostRentLoading } = useRentalsActions(
    hasToken,
    bike._id,
    station.id,
  );
  const { myWallet, getMyWallet } = useWalletActions(hasToken);
  const { data: subscriptionResponse, refetch: refetchSubscriptions }
    = useGetSubscriptionsQuery({ status: "ĐANG HOẠT ĐỘNG" }, hasToken);
  const { pendingReservations } = useReservationActions({
    hasToken,
    autoFetch: hasToken,
    pendingLimit: 5,
  });
  const {
    data: bikeDetailResponse,
    refetch: refetchBikeDetail,
    isFetching: isFetchingBikeDetail,
  } = useBikeDetailQuery(bike._id);

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

  const {
    canUseSubscription,
    paymentMode,
    remainingById,
    selectedSubscriptionId,
    setPaymentMode,
    setSelectedSubscriptionId,
  } = useBikePaymentSelection(activeSubscriptions);
  const currentBike: Bike = bikeDetailResponse?.result ?? bike;
  const isBikeAvailable = currentBike.status === "CÓ SẴN";

  const walletBalance = myWallet ? Number(myWallet.balance ?? 0) : null;

  const currentReservation: Reservation | undefined = useMemo(
    () =>
      pendingReservations.find(
        reservation => reservation.bike_id === currentBike._id,
      ),
    [pendingReservations, currentBike._id],
  );

  const ensureAuthenticated = useCallback(() => {
    if (!hasToken) {
      navigation.navigate("Login");
      return false;
    }
    if (user?.verify === "UNVERIFIED") {
      Alert.alert(
        "Tài khoản chưa xác thực",
        "Vui lòng xác thực tài khoản để tiếp tục.",
      );
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
    if (!ensureAuthenticated()) {
      return;
    }

    const bikeLabel = currentBike.chip_id
      ? `Chip #${currentBike.chip_id}`
      : `#${currentBike._id.slice(-4)}`;

    const reservationMode: ReservationMode
      = paymentMode === "subscription" ? "GÓI THÁNG" : "MỘT LẦN";
    const subscriptionForReservation
      = paymentMode === "subscription"
        ? (selectedSubscriptionId ?? activeSubscriptions[0]?._id ?? undefined)
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
    if (!ensureAuthenticated()) {
      return;
    }

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
        Alert.alert(
          "Chọn gói tháng",
          "Vui lòng chọn một gói tháng để tiếp tục.",
        );
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

  return {
    activeSubscriptions,
    bike,
    canUseSubscription,
    currentBike,
    currentReservation,
    handleBookNow,
    handleReserve,
    handleSelectPaymentMode,
    hasToken,
    insets,
    isFetchingBikeDetail,
    isBikeAvailable,
    isPostRentLoading,
    isPrimaryDisabled,
    isReserveDisabled,
    navigation,
    paymentMode,
    remainingById,
    selectedSubscriptionId,
    setSelectedSubscriptionId,
    statusColor,
    station,
    walletBalance,
  };
}
