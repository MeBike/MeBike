import { useStationActions } from "@hooks/useStationAction";
import { log } from "@lib/log";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCurrentLocation } from "@/providers/location-provider";

import type { StationDetailScreenNavigationProp } from "../../../types/navigation";

export function useStationSelect() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [showingNearby, setShowingNearby] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { location: currentLocation, refresh: refreshLocation } = useCurrentLocation();

  const {
    getAllStations,
    getNearbyStations,
    nearbyStations,
    isLoadingNearbyStations,
    stations: data,
  } = useStationActions(
    true,
    undefined,
    currentLocation?.latitude,
    currentLocation?.longitude,
  );

  useEffect(() => {
    if (showingNearby && currentLocation) {
      getNearbyStations();
    }
  }, [showingNearby, currentLocation, getNearbyStations]);

  const handleSelectStation = (stationId: string) => {
    navigation.navigate("StationDetail", { stationId });
  };

  const handleFindNearbyStations = async () => {
    if (!currentLocation) {
      log.info("Location not available");
      await refreshLocation();
    }
    setShowingNearby(!showingNearby);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (showingNearby) {
      await getNearbyStations();
    }
    else {
      await getAllStations();
    }
    setRefreshing(false);
  };

  const stations = showingNearby ? nearbyStations : data;

  return {
    stations,
    refreshing,
    showingNearby,
    isLoadingNearbyStations,
    handleSelectStation,
    handleFindNearbyStations,
    handleRefresh,
    insets,
  };
}
