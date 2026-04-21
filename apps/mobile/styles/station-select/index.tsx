import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import StationMap from "@/components/station-map";
import { useAuthNext } from "@/providers/auth-provider-next";
import { IconSymbol } from "@components/IconSymbol";
import { LoadingScreen } from "@components/LoadingScreen";
import { borderWidths } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";

import { StationList } from "./components/station-list";
import { StationSelectMapOverlay } from "./components/station-select-map-overlay";
import { useStationSelect } from "./hooks/use-station-select";

export default function StationSelectScreen() {
  const [isListOpen, setIsListOpen] = React.useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { isAuthenticated } = useAuthNext();
  const showsBackButton = navigation.canGoBack();

  const {
    stations,
    refreshing,
    showingNearby,
    route: stationRoute,
    isRouting,
    routeProfile,
    isLoadingStations,
    isLoadingNearbyStations,
    isResolvingNearbyLocation,
    isRefreshingLocation,
    handleSelectStationForRoute,
    handleFindNearbyStations,
    handleLocateUser,
    handleRefresh,
    buildRouteToSelectedStation,
    clearRoute,
    setRouteProfile,
    openSelectedStationDetail,
    deselectStation,
    currentLocation,
    selectedStationId,
    isRoutingMode,
    enterRoutingMode,
    recenterToUserLocationKey,
  } = useStationSelect();

  const selectedStation = React.useMemo(
    () => stations.find(station => station.id === selectedStationId) ?? null,
    [selectedStationId, stations],
  );

  if (isLoadingStations && !showingNearby) {
    return <LoadingScreen />;
  }

  return (
    <Screen>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <StationMap
        stations={stations}
        route={stationRoute}
        onStationPress={station => void handleSelectStationForRoute(station.id)}
        onMapPress={deselectStation}
        recenterToUserLocationKey={recenterToUserLocationKey}
        userLocation={currentLocation ?? undefined}
        selectedStationId={selectedStationId}
      />

      <YStack
        left={0}
        pointerEvents="box-none"
        position="absolute"
        right={0}
        top={0}
        zIndex="$3"
        style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}
      >
        <XStack alignItems="center" justifyContent="space-between">
          {showsBackButton
            ? (
                <Pressable onPress={() => navigation.goBack()}>
                  <AppCard
                    alignItems="center"
                    borderColor="$borderSubtle"
                    borderRadius="$round"
                    borderWidth={borderWidths.subtle}
                    chrome="flat"
                    height={44}
                    justifyContent="center"
                    padding="$0"
                    width={44}
                  >
                    <IconSymbol color={theme.textPrimary.val} name="chevron-left" size="input" />
                  </AppCard>
                </Pressable>
              )
            : <View style={{ width: 44, height: 44 }} />}

          {!isAuthenticated
            ? (
                <AppButton
                  buttonSize="compact"
                  borderRadius="$round"
                  onPress={() => navigation.navigate("Login" as never)}
                  tone="primary"
                >
                  Đăng nhập
                </AppButton>
              )
            : null}
        </XStack>
      </YStack>

      <StationSelectMapOverlay
        safeBottom={insets.bottom}
        showingNearby={showingNearby}
        isLoadingNearbyStations={isLoadingNearbyStations}
        isResolvingNearbyLocation={isResolvingNearbyLocation}
        isRefreshingLocation={isRefreshingLocation}
        destinationLabel={selectedStation
          ? selectedStation.name
          : "Chọn một trạm trên bản đồ"}
        selectedStationAddress={selectedStation?.address ?? null}
        selectedStationAvailableBikes={selectedStation?.bikes.available ?? null}
        routeProfile={routeProfile}
        routeDistanceMeters={stationRoute?.properties.distanceMeters ?? null}
        routeDurationSeconds={stationRoute?.properties.durationSeconds ?? null}
        isRouting={isRouting}
        hasDestination={Boolean(selectedStationId)}
        isRoutingMode={isRoutingMode}
        hasRoute={Boolean(stationRoute)}
        onLocateUser={handleLocateUser}
        onToggleNearby={handleFindNearbyStations}
        onOpenList={() => setIsListOpen(true)}
        onEnterRoutingMode={enterRoutingMode}
        onBuildRoute={buildRouteToSelectedStation}
        onChangeRouteProfile={setRouteProfile}
        onOpenStationDetail={openSelectedStationDetail}
        onResetSelection={deselectStation}
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
                backgroundColor: theme.overlayScrim.val,
              }}
            >
              <Pressable
                onPress={() => setIsListOpen(false)}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  top: 0,
                }}
              />

              <YStack
                backgroundColor="$surfaceDefault"
                borderTopLeftRadius="$5"
                borderTopRightRadius="$5"
                bottom={0}
                left={0}
                maxHeight="82%"
                overflow="hidden"
                position="absolute"
                right={0}
              >
                <YStack
                  borderBottomColor="$borderSubtle"
                  borderBottomWidth={borderWidths.subtle}
                  gap="$3"
                  padding="$5"
                >
                  <XStack alignItems="center" justifyContent="space-between">
                    <YStack flex={1} gap="$1" paddingRight="$3">
                      <AppText variant="title">Danh sách trạm</AppText>
                      <AppText tone="muted" variant="bodySmall">
                        {stations.length}
                        {" "}
                        trạm hiển thị
                      </AppText>
                    </YStack>

                    <Pressable hitSlop={8} onPress={() => setIsListOpen(false)}>
                      <AppCard
                        alignItems="center"
                        backgroundColor="$surfaceMuted"
                        borderRadius="$round"
                        chrome="flat"
                        height={40}
                        justifyContent="center"
                        padding="$0"
                        width={40}
                      >
                        <IconSymbol color={theme.textSecondary.val} name="close" size="input" />
                      </AppCard>
                    </Pressable>
                  </XStack>

                </YStack>

                <StationList
                  stations={stations}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onSelectStation={(stationId) => {
                    void handleSelectStationForRoute(stationId);
                    setIsListOpen(false);
                  }}
                />
              </YStack>
            </View>
          )
        : null}
    </Screen>
  );
}
