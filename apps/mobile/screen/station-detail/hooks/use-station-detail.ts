import { useGetStationById } from "@hooks/query/Station/use-get-station-by-id-query";
import { useBikeActions } from "@hooks/useBikeAction";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";

import type { BikeSummary } from "@/contracts/server";

import type {
  StationDetailRouteProp,
  StationDetailScreenNavigationProp,
} from "../../../types/navigation";

const PAGE_SIZE = 20;

export function useStationDetail() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const route = useRoute<StationDetailRouteProp>();
  const {
    stationId,
    selectionMode,
    rentalId,
    currentReturnStationId,
  } = route.params;

  const [currentPage, setCurrentPage] = useState(1);
  const [loadedBikes, setLoadedBikes] = useState<BikeSummary[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [focusedBike, setFocusedBike] = useState<BikeSummary | null>(null);

  const stationQuery = useGetStationById(stationId);

  const {
    allBikes,
    isFetchingAllBikes,
    getBikes,
    totalRecords,
  } = useBikeActions({
    hasToken: true,
    stationId,
    page: currentPage,
    limit: PAGE_SIZE,
    status: "AVAILABLE",
  });

  useEffect(() => {
    if (stationId) {
      getBikes();
    }
  }, [stationId, currentPage, getBikes]);

  useEffect(() => {
    if (allBikes && allBikes.length > 0) {
      if (currentPage === 1) {
        setLoadedBikes(allBikes);
      }
      else {
        setLoadedBikes(prev => [...prev, ...allBikes]);
      }
      setHasMore(allBikes.length === PAGE_SIZE);
    }
    else if (currentPage > 1) {
      setHasMore(false);
    }
    if (refreshing)
      setRefreshing(false);
  }, [allBikes, currentPage, refreshing]);

  const station = stationQuery.data ?? null;
  const isLoading = stationQuery.isLoading || isFetchingAllBikes;

  const handleBikePress = useCallback(
    (bike: BikeSummary) => {
      if (!station)
        return;
      setFocusedBike(bike);
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
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    setLoadedBikes([]);
    void stationQuery.refetch();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetchingAllBikes) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, isFetchingAllBikes]);

  return {
    station,
    isLoading,
    loadedBikes,
    allBikes,
    isFetchingAllBikes,
    hasMore,
    totalRecords,
    refreshing,
    focusedBike,
    handleBikePress,
    handleRefresh,
    handleLoadMore,
    navigation,
    selectionMode,
    rentalId,
    currentReturnStationId,
  };
}
