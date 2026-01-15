import { LoadingScreen } from "@components/LoadingScreen";
import { BikeColors } from "@constants/BikeColors";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import StationMap from "@/components/station-map";

import { StationList } from "./components/station-list";
import { StationSelectMapOverlay } from "./components/station-select-map-overlay";
import { useStationSelect } from "./hooks/use-station-select";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.surface,
    padding: 0,
  },
});

export default function StationSelectScreen() {
  const [isListOpen, setIsListOpen] = React.useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const {
    stations,
    refreshing,
    showingNearby,
    route,
    isRouting,
    routeProfile,
    isLoadingNearbyStations,
    handleSelectStationForRoute,
    handleFindNearbyStations,
    handleRefresh,
    buildRouteToSelectedStation,
    clearRoute,
    setRouteProfile,
    openSelectedStationDetail,
    currentLocation,
    selectedStationId,
  } = useStationSelect();

  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: "none" } });
      return () => parent?.setOptions({ tabBarStyle: undefined });
    }, [navigation]),
  );

  if (
    !Array.isArray(stations)
    || stations === null
    || stations.length === 0
  ) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <StationMap
        stations={stations}
        route={route}
        onStationPress={station => handleSelectStationForRoute(station._id)}
        userLocation={currentLocation ?? undefined}
      />
      <StationSelectMapOverlay
        safeTop={insets.top}
        showingNearby={showingNearby}
        isLoadingNearbyStations={isLoadingNearbyStations}
        destinationLabel={selectedStationId
          ? stations.find(s => s._id === selectedStationId)?.name ?? "Trạm đã chọn"
          : "Chọn một trạm trên bản đồ"}
        routeProfile={routeProfile}
        routeDistanceMeters={route?.properties.distanceMeters ?? null}
        routeDurationSeconds={route?.properties.durationSeconds ?? null}
        isRouting={isRouting}
        hasDestination={Boolean(selectedStationId)}
        hasRoute={Boolean(route)}
        onToggleNearby={handleFindNearbyStations}
        onOpenList={() => setIsListOpen(true)}
        onBuildRoute={buildRouteToSelectedStation}
        onChangeRouteProfile={setRouteProfile}
        onOpenStationDetail={openSelectedStationDetail}
        onClearRoute={clearRoute}
      />
      {isListOpen
        ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                top: 0,
                backgroundColor: "rgba(0,0,0,0.35)",
              }}
              onTouchEnd={() => setIsListOpen(false)}
            >
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  maxHeight: "72%",
                  backgroundColor: "white",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: "hidden",
                }}
              >
                <StationList
                  stations={stations}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onSelectStation={(stationId) => {
                    void handleSelectStationForRoute(stationId);
                    setIsListOpen(false);
                  }}
                />
              </View>
            </View>
          )
        : null}
    </View>
  );
}
