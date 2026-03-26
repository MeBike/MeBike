import { useCreateRentalMutation } from "@hooks/mutations/rentals/use-create-rental-mutation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";

import type { BikeSummary } from "@/contracts/server";
import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Subscription } from "@/types/subscription-types";

import { isBikeAvailable as isBikeAvailableStatus } from "@/utils/bike";

import type { PaymentMode } from "../types";

import { showSubscriptionRequiredAlert } from "../helpers/create-rental-alerts";
import {
  handleCreateRentalError,
  handleCreateRentalSuccess,
} from "../helpers/create-rental-behavior";
import {
  buildCreateRentalPayload,
  buildReservationFlowParams,
  navigateToReservationFlow,
} from "../helpers/create-rental-helpers";

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

  const reservationFlowParams = useMemo(() => buildReservationFlowParams({
    currentBike,
    station,
    paymentMode,
    activeSubscriptions,
    selectedSubscriptionId,
  }), [activeSubscriptions, currentBike, paymentMode, selectedSubscriptionId, station]);

  const createRentalPayload = useMemo(() => buildCreateRentalPayload({
    currentBike,
    station,
    paymentMode,
    selectedSubscriptionId,
  }), [currentBike, paymentMode, selectedSubscriptionId, station]);

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

    navigateToReservationFlow(navigation, reservationFlowParams);
  }, [currentBike.status, ensureAuthenticated, navigation, reservationFlowParams]);

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

    if (!createRentalPayload) {
      Alert.alert("Chọn gói tháng", "Vui lòng chọn một gói tháng để tiếp tục.");
      return;
    }

    createRentalMutation.mutate(createRentalPayload, {
      onSuccess: rental => handleCreateRentalSuccess({
        rentalId: rental.id,
        navigation,
        queryClient,
        refetchBikeDetail,
        refreshWallet,
      }),
      onError: error => handleCreateRentalError({
        error,
        navigation,
        queryClient,
        refetchBikeDetail,
      }),
    });
  }, [
    activeSubscriptions.length,
    createRentalMutation,
    createRentalPayload,
    currentBike.status,
    ensureAuthenticated,
    navigation,
    paymentMode,
    queryClient,
    refetchBikeDetail,
    refreshWallet,
  ]);

  return {
    isBookingNow: createRentalMutation.isPending,
    handleReserve,
    handleBookNow,
  };
}
