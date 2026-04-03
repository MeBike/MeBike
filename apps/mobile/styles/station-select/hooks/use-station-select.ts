import type { MapboxDirectionsProfile } from "@lib/mapbox-directions";

import { useStationRouteQuery } from "@hooks/query/Station/use-station-route-query";
import { useStationActions } from "@hooks/useStationAction";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCurrentLocation } from "@/providers/location-provider";

import type {
  StationDetailScreenNavigationProp,
  StationSelectRouteProp,
} from "../../../types/navigation";

export function useStationSelect() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const stationSelectRoute = useRoute<StationSelectRouteProp>();
  const insets = useSafeAreaInsets();
  const [showingNearby, setShowingNearby] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedStationId, setSelectedStationId] = React.useState<string | null>(null);
  const [routeProfile, setRouteProfile] = React.useState<MapboxDirectionsProfile>("walking");
  const [routeRequested, setRouteRequested] = React.useState(false);
  const [isRoutingMode, setIsRoutingMode] = React.useState(false);
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
    navigation.navigate("StationDetail", {
      stationId,
      ...(stationSelectRoute.params?.selectionMode
        ? {
            selectionMode: stationSelectRoute.params.selectionMode,
            rentalId: stationSelectRoute.params.rentalId,
            currentReturnStationId: stationSelectRoute.params.currentReturnStationId,
            currentBikeSwapStationId: stationSelectRoute.params.currentBikeSwapStationId,
          }
        : {}),
    });
  };

  const handleFindNearbyStations = async () => {
    await refreshLocation();
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

  const selectedStation = React.useMemo(() => {
    if (!selectedStationId)
      return null;
    return stations.find(s => s.id === selectedStationId) ?? null;
  }, [selectedStationId, stations]);

  const destination = React.useMemo(() => {
    if (!selectedStation)
      return null;

    return {
      latitude: selectedStation.location.latitude,
      longitude: selectedStation.location.longitude,
    };
  }, [selectedStation]);

  const routeQuery = useStationRouteQuery({
    origin: currentLocation ?? null,
    destination,
    profile: routeProfile,
    enabled: routeRequested,
  });

  const route = routeRequested ? (routeQuery.data ?? null) : null;
  const isRouting = routeQuery.isFetching;

  const handleSelectStationForRoute = async (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    if (!station)
      return;

    setSelectedStationId(stationId);
    setRouteRequested(false);
    setIsRoutingMode(false);

    if (!currentLocation) {
      await refreshLocation();
    }
  };

  const deselectStation = () => {
    setSelectedStationId(null);
    setRouteRequested(false);
    setIsRoutingMode(false);
  };

  const clearRoute = () => {
    setRouteRequested(false);
  };

  const enterRoutingMode = () => {
    if (!selectedStationId) {
      return;
    }
    setIsRoutingMode(true);
  };

  const buildRouteToSelectedStation = React.useCallback(async () => {
    if (!selectedStationId)
      return;

    if (!selectedStation)
      return;

    if (!currentLocation) {
      await refreshLocation();
    }

    setIsRoutingMode(true);
    setRouteRequested(true);
  }, [currentLocation, refreshLocation, selectedStation, selectedStationId]);

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
    isRoutingMode,
    route,
    isRouting,
    routeProfile,
    isLoadingNearbyStations,
    handleSelectStation,
    handleSelectStationForRoute,
    handleFindNearbyStations,
    handleRefresh,
    buildRouteToSelectedStation,
    enterRoutingMode,
    clearRoute,
    setRouteProfile,
    openSelectedStationDetail,
    deselectStation,
    insets,
    currentLocation,
  };
}
