import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import type { StationDetailScreenNavigationProp } from "../../../types/navigation";

import { fetchStations } from "../api/stations.api";

export function useStationSelect() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const stationsQuery = useQuery({
    queryKey: ["stations", "select"],
    queryFn: () => fetchStations(),
  });

  const handleSelectStation = useCallback(
    (stationId: string) => {
      navigation.navigate("StationDetail", { stationId });
    },
    [navigation],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await stationsQuery.refetch();
    setRefreshing(false);
  }, [stationsQuery]);

  return {
    stations: stationsQuery.data?.stations ?? [],
    isLoading: stationsQuery.isLoading,
    refreshing,
    handleRefresh,
    handleSelectStation,
  };
}
