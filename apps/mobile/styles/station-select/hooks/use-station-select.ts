import type { MapboxDirectionsProfile } from "@lib/mapbox-directions";

import { useGetNearbyStationsQuery } from "@hooks/query/stations/use-get-nearby-stations-query";
import { useGetStationListQuery } from "@hooks/query/stations/use-get-station-list-query";
import { useStationRouteQuery } from "@hooks/query/stations/use-station-route-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import React from "react";
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

  const { data: allStations = [], refetch: refetchAllStations } = useGetStationListQuery();
  const {
    data: nearbyStations = [],
    isLoading: isLoadingNearbyStations,
    refetch: refetchNearbyStations,
  } = useGetNearbyStationsQuery(
    currentLocation?.latitude ?? 0,
    currentLocation?.longitude ?? 0,
    showingNearby && Boolean(currentLocation),
  );

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
    await (showingNearby ? refetchNearbyStations() : refetchAllStations());
    setRefreshing(false);
  };

  const stations = showingNearby ? nearbyStations : allStations;

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
