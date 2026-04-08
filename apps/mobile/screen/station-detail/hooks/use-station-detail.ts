import { useGetStationDetailQuery } from "@hooks/query/stations/use-get-station-detail-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback } from "react";

import type { BikeSummary } from "@/contracts/server";

import type {
  StationDetailRouteProp,
  StationDetailScreenNavigationProp,
} from "../../../types/navigation";

import { useStationBikes } from "./use-station-bikes";

const PAGE_SIZE = 20;

export function useStationDetail() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const route = useRoute<StationDetailRouteProp>();
  const {
    stationId,
    selectionMode,
    rentalId,
    currentReturnStationId,
    currentBikeSwapStationId,
  } = route.params;

  const {
    data: stationData,
    isLoading: isStationLoading,
    isRefetching: isStationRefetching,
    refetch: refetchStation,
  } = useGetStationDetailQuery(stationId);
  const {
    bikes: loadedBikes,
    hasMore,
    isFetchingMore: isFetchingAllBikes,
    isLoadingBikes,
    isRefreshing: isRefreshingBikes,
    loadMore,
    refresh: refreshBikes,
    totalRecords,
  } = useStationBikes({ pageSize: PAGE_SIZE, stationId });

  const station = stationData ?? null;
  const isLoading = isStationLoading || isLoadingBikes;

  const handleBikePress = useCallback(
    (bike: BikeSummary) => {
      if (!station)
        return;
      navigation.navigate("BikeDetail", {
        bike,
        station: {
          id: stationId,
          name: station.name,
          address: station.address,
        },
      });
    },
    [navigation, station, stationId],
  );

  const handleRefresh = useCallback(() => {
    void Promise.allSettled([refetchStation(), refreshBikes()]);
  }, [refetchStation, refreshBikes]);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  return {
    station,
    isLoading,
    loadedBikes,
    isFetchingAllBikes,
    hasMore,
    totalRecords,
    refreshing: isStationRefetching || isRefreshingBikes,
    handleBikePress,
    handleRefresh,
    handleLoadMore,
    navigation,
    selectionMode,
    rentalId,
    currentReturnStationId,
    currentBikeSwapStationId,
  };
}
