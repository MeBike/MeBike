import { useGetBikeByIDAllQuery } from "@hooks/query/Bike/use-get-bike-by-id-query";
import { useGetSubscriptionsQuery } from "@hooks/query/subscription/use-get-subscriptions-query";
import { useReservationActions } from "@hooks/use-reservation-actions";
import { useWalletActions } from "@hooks/useWalletAction";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo } from "react";

import type { BikeSummary } from "@/contracts/server";
import type { Reservation } from "@/types/reservation-types";
import type { Subscription } from "@/types/subscription-types";

import { isBikeAvailable as isBikeAvailableStatus } from "@/utils/bike";
import { parseDecimal } from "@/utils/money";

import type { BikeDetailRouteParams } from "../types";

type UseBikeDetailDataArgs = {
  routeParams: BikeDetailRouteParams;
  hasToken: boolean;
};

export function useBikeDetailData({ routeParams, hasToken }: UseBikeDetailDataArgs) {
  const { bike, station } = routeParams;

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
    }, [bikeDetailQuery, hasToken, subscriptionsQuery]),
  );

  const activeSubscriptions: Subscription[] = useMemo(
    () => subscriptionsQuery.data?.data ?? [],
    [subscriptionsQuery.data?.data],
  );

  const currentBike: BikeSummary = bikeDetailQuery.data ?? bike;
  const isBikeAvailable = isBikeAvailableStatus(currentBike.status);
  const canUseSubscription = activeSubscriptions.length > 0;
  const walletBalance = myWallet ? parseDecimal(myWallet.balance) : null;

  const currentReservation: Reservation | undefined = useMemo(
    () => pendingReservations.find(item => item.bikeId === currentBike.id),
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
    activeSubscriptions,
    canUseSubscription,
    walletBalance,
    handleRefresh,
    refetchBikeDetail: bikeDetailQuery.refetch,
    refreshWallet: getMyWallet,
  };
}
