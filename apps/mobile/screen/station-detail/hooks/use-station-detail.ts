import { useBikeActions } from "@hooks/use-bike-action";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Bike } from "../../../types/BikeTypes";
import type {
  StationDetailRouteProp,
  StationDetailScreenNavigationProp,
} from "../../../types/navigation";

import { fetchStationDetail } from "../api/station-detail.api";

const PAGE_SIZE = 20;

export function useStationDetail() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const route = useRoute<StationDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { stationId } = route.params;

  const [currentPage, setCurrentPage] = useState(1);
  const [loadedBikes, setLoadedBikes] = useState<Bike[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [focusedBike, setFocusedBike] = useState<Bike | null>(null);

  const stationQuery = useQuery({
    queryKey: ["stations", "detail", stationId],
    queryFn: () => fetchStationDetail(stationId),
    enabled: Boolean(stationId),
  });

  const { allBikes, isFetchingAllBikes, getBikes, totalRecords } =
    useBikeActions({
      hasToken: true,
      station_id: stationId,
      page: currentPage,
      limit: PAGE_SIZE,
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
      } else {
        setLoadedBikes((prev) => [...prev, ...allBikes]);
      }
      setHasMore(allBikes.length === PAGE_SIZE);
    } else if (currentPage > 1) {
      setHasMore(false);
    }
    if (refreshing) {
      setRefreshing(false);
    }
  }, [allBikes, currentPage, refreshing]);

  const station = stationQuery.data ?? null;
  const isLoading = stationQuery.isLoading || isFetchingAllBikes;

  const handleBikePress = useCallback(
    (bike: Bike) => {
      if (!station) {
        return;
      }
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
  }, [stationQuery]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetchingAllBikes) {
      setCurrentPage((prev) => prev + 1);
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
    insets,
  };
}
