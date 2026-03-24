import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";

import { useCreateRentalMutation } from "@hooks/mutations/rentals/use-create-rental-mutation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";

import type { BikeSummary } from "@/contracts/server";
import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Subscription } from "@/types/subscription-types";

import { isBikeAvailable as isBikeAvailableStatus } from "@/utils/bike";

import type { PaymentMode } from "../types";

type UseBikeDetailActionsArgs = {
  currentBike: BikeSummary;
  station: {
    id: string;
    name: string;
    address: string;
  };
  hasToken: boolean;
  verifyStatus: "UNVERIFIED" | "VERIFIED" | string | undefined;
  navigation: BikeDetailNavigationProp;
  paymentMode: PaymentMode;
  activeSubscriptions: Subscription[];
  selectedSubscriptionId: string | null;
  refetchBikeDetail: () => Promise<unknown>;
  refreshWallet: () => Promise<unknown> | undefined;
};

function showSubscriptionRequiredAlert(navigation: BikeDetailNavigationProp) {
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
}

export function useBikeDetailActions({
  currentBike,
  station,
  hasToken,
  verifyStatus,
  navigation,
  paymentMode,
  activeSubscriptions,
  selectedSubscriptionId,
  refetchBikeDetail,
  refreshWallet,
}: UseBikeDetailActionsArgs) {
  const queryClient = useQueryClient();
  const createRentalMutation = useCreateRentalMutation();

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

  const handleReserve = useCallback(() => {
    if (!isBikeAvailableStatus(currentBike.status)) {
      Alert.alert("Xe không khả dụng", "Vui lòng chọn một xe khác.");
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

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
  }, [activeSubscriptions, currentBike, ensureAuthenticated, navigation, paymentMode, selectedSubscriptionId, station]);

  const handleBookNow = useCallback(() => {
    if (!isBikeAvailableStatus(currentBike.status)) {
      Alert.alert("Xe không khả dụng", "Vui lòng chọn xe khác.");
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    if (paymentMode === "subscription" && activeSubscriptions.length === 0) {
      showSubscriptionRequiredAlert(navigation);
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
        refetchBikeDetail();
        refreshWallet();
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
    createRentalMutation,
    currentBike,
    ensureAuthenticated,
    navigation,
    paymentMode,
    queryClient,
    refetchBikeDetail,
    refreshWallet,
    selectedSubscriptionId,
    station.id,
  ]);

  return {
    isBookingNow: createRentalMutation.isPending,
    handleReserve,
    handleBookNow,
  };
}
