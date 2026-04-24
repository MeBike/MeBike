import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ReservationFlowNavigationProp, ReservationFlowRouteProp } from "@/types/navigation";

import { useGetSubscriptionsQuery } from "@hooks/query/subscription/use-get-subscriptions-query";
import { useReservationActions } from "@hooks/use-reservation-actions";
import { useAuthNext } from "@providers/auth-provider-next";

export function useReservationFlowData() {
  const navigation = useNavigation<ReservationFlowNavigationProp>();
  const route = useRoute<ReservationFlowRouteProp>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthNext();

  const hasToken = isAuthenticated;

  const {
    stationId,
    stationName,
    stationAddress,
    bikeId,
    bikeName,
    initialMode,
    initialSubscriptionId,
    lockPaymentSelection = false,
  } = route.params;

  const { createReservation } = useReservationActions({
    hasToken,
    autoFetch: false,
  });

  const {
    data: subscriptionResponse,
    refetch: refetchSubscriptions,
  } = useGetSubscriptionsQuery(
    { status: "ACTIVE", pageSize: 10 },
    hasToken,
    user?.id,
  );

  const activeSubscriptions = useMemo(
    () => subscriptionResponse?.data ?? [],
    [subscriptionResponse],
  );

  useFocusEffect(
    useCallback(() => {
      if (hasToken) {
        refetchSubscriptions();
      }
    }, [hasToken, refetchSubscriptions]),
  );

  return {
    navigation,
    insets,
    hasToken,
    createReservation,
    stationId,
    stationName,
    stationAddress,
    bikeId,
    bikeName,
    initialMode,
    initialSubscriptionId,
    lockPaymentSelection,
    activeSubscriptions,
    subscriptionsLoaded: subscriptionResponse !== undefined,
  };
}
