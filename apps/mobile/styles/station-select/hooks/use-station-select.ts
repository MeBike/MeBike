import { useStationActions } from "@hooks/useStationAction";
import { log } from "@lib/log";
import { getRouteLine } from "@lib/mapbox-directions";
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
  const [selectedStationId, setSelectedStationId] = React.useState<string | null>(null);
  const [route, setRoute] = React.useState<import("@lib/mapbox-directions").MapboxRouteLine | null>(null);
  const [isRouting, setIsRouting] = React.useState(false);
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

  const handleSelectStationForRoute = async (stationId: string) => {
    const station = stations.find(s => s._id === stationId);
    if (!station)
      return;

    setSelectedStationId(stationId);
    setRoute(null);

    if (!currentLocation) {
      await refreshLocation();
    }
  };

  const clearRoute = () => {
    setRoute(null);
  };

  const buildRouteToSelectedStation = async () => {
    if (!selectedStationId)
      return;

    const station = stations.find(s => s._id === selectedStationId);
    if (!station)
      return;

    if (!currentLocation) {
      await refreshLocation();
      return;
    }

    setIsRouting(true);
    try {
      const nextRoute = await getRouteLine(
        currentLocation,
        {
          latitude: Number.parseFloat(station.latitude),
          longitude: Number.parseFloat(station.longitude),
        },
      );
      setRoute(nextRoute);
    }
    finally {
      setIsRouting(false);
    }
  };

  const openSelectedStationDetail = () => {
    if (!selectedStationId)
      return;
    handleSelectStation(selectedStationId);
  };

  return {
    stations,
    refreshing,
    showingNearby,
    selectedStationId,
    route,
    isRouting,
    isLoadingNearbyStations,
    handleSelectStation,
    handleSelectStationForRoute,
    handleFindNearbyStations,
    handleRefresh,
    buildRouteToSelectedStation,
    clearRoute,
    openSelectedStationDetail,
    insets,
    currentLocation,
  };
}
