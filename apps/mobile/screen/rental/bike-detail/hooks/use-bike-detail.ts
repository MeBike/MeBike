import type { BikeDetailNavigationProp } from "@/types/navigation";

import type { BikeDetailRouteParams } from "../types";

import { useBikeDetailActions } from "./use-bike-detail-actions";
import { useBikeDetailData } from "./use-bike-detail-data";
import { useBikeDetailPayment } from "./use-bike-detail-payment";

export type UseBikeDetailArgs = {
  routeParams: BikeDetailRouteParams;
  hasToken: boolean;
  userId?: string | null;
  verifyStatus: "UNVERIFIED" | "VERIFIED" | string | undefined;
  navigation: BikeDetailNavigationProp;
};

export function useBikeDetail({ routeParams, hasToken, userId, verifyStatus, navigation }: UseBikeDetailArgs) {
  const data = useBikeDetailData({ routeParams, hasToken, walletScope: userId, userId });
  const payment = useBikeDetailPayment({
    activeSubscriptions: data.activeSubscriptions,
    canUseSubscription: data.canUseSubscription,
    navigation,
  });
  const actions = useBikeDetailActions({
    currentBike: data.currentBike,
    station: data.station,
    hasToken,
    verifyStatus,
    navigation,
    paymentMode: payment.paymentMode,
    activeSubscriptions: data.activeSubscriptions,
    selectedSubscriptionId: payment.selectedSubscriptionId,
    refetchBikeDetail: data.refetchBikeDetail,
    refreshWallet: data.refreshWallet,
  });

  return {
    station: data.station,
    currentBike: data.currentBike,
    isBikeAvailable: data.isBikeAvailable,
    isFetchingBikeDetail: data.isFetchingBikeDetail,
    isRefreshing: data.isRefreshing,
    currentReservation: data.currentReservation,
    paymentMode: payment.paymentMode,
    canUseSubscription: data.canUseSubscription,
    walletBalance: data.walletBalance,
    activeSubscriptions: data.activeSubscriptions,
    selectedSubscriptionId: payment.selectedSubscriptionId,
    setSelectedSubscriptionId: payment.setSelectedSubscriptionId,
    isBookingNow: actions.isBookingNow,
    handleRefresh: data.handleRefresh,
    handleSelectPaymentMode: payment.handleSelectPaymentMode,
    handleReserve: actions.handleReserve,
    handleBookNow: actions.handleBookNow,
  };
}
