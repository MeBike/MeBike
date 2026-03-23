import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";

import { useCreateRentalMutation } from "@hooks/mutations/rentals/use-create-rental-mutation";
import { useGetBikeByIDAllQuery } from "@hooks/query/Bike/use-get-bike-by-id-query";
import { useGetSubscriptionsQuery } from "@hooks/query/subscription/use-get-subscriptions-query";
import { useReservationActions } from "@hooks/use-reservation-actions";
import { useWalletActions } from "@hooks/useWalletAction";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import type { BikeSummary } from "@/contracts/server";
import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Reservation } from "@/types/reservation-types";

import { isBikeAvailable as isBikeAvailableStatus } from "@/utils/bike";
import { parseDecimal } from "@/utils/money";

import type { BikeDetailRouteParams, PaymentMode } from "../types";

export type UseBikeDetailArgs = {
  routeParams: BikeDetailRouteParams;
  hasToken: boolean;
  verifyStatus: "UNVERIFIED" | "VERIFIED" | string | undefined;
  navigation: BikeDetailNavigationProp;
};

export function useBikeDetail({ routeParams, hasToken, verifyStatus, navigation }: UseBikeDetailArgs) {
  const { bike, station } = routeParams;
  const queryClient = useQueryClient();
  const createRentalMutation = useCreateRentalMutation();

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("wallet");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);

  const { myWallet, getMyWallet } = useWalletActions(hasToken);
  const {
    pendingReservations,
    fetchPendingReservations,
    isPendingReservationsFetching,
  } = useReservationActions({
    hasToken,
    autoFetch: hasToken,
    pendingLimit: 5,
  });

  const subscriptionsQuery = useGetSubscriptionsQuery({ status: "ACTIVE" }, hasToken);
  const bikeDetailQuery = useGetBikeByIDAllQuery(bike.id);

  useEffect(() => {
    if (hasToken) {
      getMyWallet();
    }
  }, [getMyWallet, hasToken]);

  useFocusEffect(
    useCallback(() => {
      bikeDetailQuery.refetch();
      if (hasToken) {
        subscriptionsQuery.refetch();
      }
    }, [bikeDetailQuery.refetch, hasToken, subscriptionsQuery.refetch]),
  );

  const activeSubscriptions = useMemo(
    () => subscriptionsQuery.data?.data ?? [],
    [subscriptionsQuery.data?.data],
  );

  const canUseSubscription = activeSubscriptions.length > 0;
  const currentBike: BikeSummary = bikeDetailQuery.data ?? bike;
  const isBikeAvailable = isBikeAvailableStatus(currentBike.status);

  useEffect(() => {
    if (!canUseSubscription) {
      setPaymentMode("wallet");
      setSelectedSubscriptionId(null);
      return;
    }

    if (paymentMode === "subscription") {
      const stillValid = activeSubscriptions.some(s => s.id === selectedSubscriptionId);
      if (!stillValid) {
        setSelectedSubscriptionId(activeSubscriptions[0]?.id ?? null);
      }
    }
  }, [activeSubscriptions, canUseSubscription, paymentMode, selectedSubscriptionId]);

  const walletBalance = myWallet
    ? parseDecimal(myWallet.balance)
    : null;

  const currentReservation: Reservation | undefined = useMemo(
    () => pendingReservations.find(r => r.bikeId === currentBike.id),
    [pendingReservations, currentBike.id],
  );

  const handleRefresh = useCallback(async () => {
    const tasks: Array<Promise<unknown> | undefined> = [bikeDetailQuery.refetch()];

    if (hasToken) {
      tasks.push(subscriptionsQuery.refetch());
      tasks.push(getMyWallet());
      tasks.push(fetchPendingReservations());
    }

    await Promise.allSettled(tasks.filter((task): task is Promise<unknown> => Boolean(task)));
  }, [bikeDetailQuery, fetchPendingReservations, getMyWallet, hasToken, subscriptionsQuery]);

  const ensureAuthenticated = useCallback(() => {
    if (!hasToken) {
      navigation.navigate("Login");
      return false;
    }
    if (verifyStatus === "UNVERIFIED") {
      Alert.alert("Tài khoản chưa xác thực", "Vui lòng xác thực tài khoản để tiếp tục.");
      return false;
    }
    return true;
  }, [hasToken, navigation, verifyStatus]);

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
    if (!isBikeAvailableStatus(currentBike.status)) {
      Alert.alert("Xe không khả dụng", "Vui lòng chọn một xe khác.");
      return;
    }
    if (!ensureAuthenticated())
      return;

    const bikeLabel = currentBike.chipId
      ? `Chip #${currentBike.chipId}`
      : `#${currentBike.id.slice(-4)}`;

    const reservationMode: ReservationMode = paymentMode === "subscription" ? "GÓI THÁNG" : "MỘT LẦN";
    const subscriptionForReservation = paymentMode === "subscription"
      ? selectedSubscriptionId ?? activeSubscriptions[0]?.id ?? undefined
      : undefined;

    navigation.navigate("ReservationFlow", {
      stationId: station.id,
      stationName: station.name,
      stationAddress: station.address,
      bikeId: currentBike.id,
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
    if (!isBikeAvailableStatus(currentBike.status)) {
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

    const payload: {
      bikeId: string;
      startStationId: string;
      subscriptionId?: string;
    } = {
      bikeId: currentBike.id,
      startStationId: station.id,
    };

    if (paymentMode === "subscription") {
      if (!selectedSubscriptionId) {
        Alert.alert("Chọn gói tháng", "Vui lòng chọn một gói tháng để tiếp tục.");
        return;
      }
      payload.subscriptionId = selectedSubscriptionId;
    }

    createRentalMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert("Thành công", "Thuê xe thành công.");
        bikeDetailQuery.refetch();
        getMyWallet();
        queryClient.invalidateQueries({ queryKey: ["bikes", "all"] });
        queryClient.invalidateQueries({ queryKey: ["all-stations"] });
        queryClient.invalidateQueries({ queryKey: ["station"] });
        queryClient.invalidateQueries({ queryKey: ["rentals", "me"] });
        queryClient.invalidateQueries({ queryKey: ["rentals", "me", "history"] });
        queryClient.invalidateQueries({ queryKey: ["rentals", "me", "counts"] });
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      },
      onError: (error) => {
        if (error._tag === "ApiError") {
          if (error.code === "NOT_ENOUGH_BALANCE_TO_RENT") {
            Alert.alert(
              "Không đủ tiền",
              error.message ?? "Số dư không đủ để bắt đầu phiên thuê.",
              [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Nạp tiền ngay",
                  onPress: () => navigation.navigate("MyWallet"),
                },
              ],
            );
            return;
          }
          Alert.alert("Lỗi", error.message ?? "Không thể thuê xe. Vui lòng thử lại.");
          return;
        }
        Alert.alert("Lỗi", "Không thể thuê xe. Vui lòng thử lại.");
      },
    });
  }, [
    activeSubscriptions.length,
    bikeDetailQuery,
    currentBike,
    ensureAuthenticated,
    getMyWallet,
    navigation,
    paymentMode,
    queryClient,
    selectedSubscriptionId,
    station.id,
    createRentalMutation,
  ]);

  return {
    station,
    currentBike,
    isBikeAvailable,
    isFetchingBikeDetail: bikeDetailQuery.isFetching,
    isRefreshing:
      bikeDetailQuery.isRefetching
      || subscriptionsQuery.isRefetching
      || isPendingReservationsFetching,
    currentReservation,

    paymentMode,
    canUseSubscription,
    walletBalance,
    activeSubscriptions,
    selectedSubscriptionId,
    setSelectedSubscriptionId,

    isBookingNow: createRentalMutation.isPending,
    handleRefresh,
    handleSelectPaymentMode,
    handleReserve,
    handleBookNow,
  };
}
