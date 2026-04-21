import type { MetroDirectionId } from "@services/metro";

import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useGetStationListQuery } from "@hooks/query/stations/use-get-station-list-query";
import { metroDirectionOptions, metroService } from "@services/metro";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import type { MetroJourneyNavigationProp } from "@/types/navigation";

const metroJourneyQueryKey = "metro-journey";
const metroJourneyPollIntervalMs = 15_000;

function presentMetroError(error: unknown) {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Không thể tải dữ liệu Metro lúc này. Vui lòng thử lại sau.";
}

export function useMetroJourneyScreen() {
  const navigation = useNavigation<MetroJourneyNavigationProp>();
  const isFocused = useIsFocused();
  const [directionId, setDirectionId] = useState<MetroDirectionId>(1);
  const { data: stations = [] } = useGetStationListQuery();

  const journeyQuery = useQuery({
    queryKey: [metroJourneyQueryKey, directionId],
    queryFn: () => metroService.getJourney(directionId),
    refetchInterval: isFocused ? metroJourneyPollIntervalMs : false,
    staleTime: 10_000,
  });

  const activeDirection = useMemo(
    () => metroDirectionOptions.find(option => option.directionId === directionId) ?? metroDirectionOptions[0],
    [directionId],
  );

  const stationIdByName = useMemo(
    () => new Map(stations.map(station => [station.name, station.id])),
    [stations],
  );

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    await journeyQuery.refetch();
  }, [journeyQuery]);

  const openStationDetail = useCallback((stationName: string) => {
    const stationId = stationIdByName.get(stationName);

    if (!stationId) {
      return;
    }

    navigation.navigate("StationDetail", { stationId });
  }, [navigation, stationIdByName]);

  return {
    data: journeyQuery.data ?? null,
    directionId,
    directionOptions: metroDirectionOptions,
    activeDirection,
    isInitialLoading: journeyQuery.isLoading && !journeyQuery.data,
    isRefreshing: journeyQuery.isRefetching && !journeyQuery.isLoading,
    initialError: journeyQuery.isError && !journeyQuery.data
      ? presentMetroError(journeyQuery.error)
      : null,
    refreshError: journeyQuery.isError && journeyQuery.data
      ? presentMetroError(journeyQuery.error)
      : null,
    canOpenStationDetail: stationIdByName.size > 0,
    actions: {
      goBack,
      onRefresh,
      openStationDetail,
      setDirection: setDirectionId,
    },
  };
}
