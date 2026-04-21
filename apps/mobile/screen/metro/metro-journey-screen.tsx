import type { MetroDirectionId, MetroDirectionOption, MetroJourneyStation, MetroVehicle } from "@services/metro";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations, radii } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, View, XStack, YStack } from "tamagui";

import { useMetroJourneyScreen } from "./hooks/use-metro-journey-screen";

const routeRailWidth = 8;
const routeStationMarkerSize = 18;
const routeTrainMarkerSize = 28;
const routeTrainAuraSize = routeTrainMarkerSize + 10;
const routeRowHalfHeight = 32;
const routeSegmentMinHeight = 78;
const routePixelsPerKm = 54;
const routeRailLeftInset = 54;
const routeRowRightInset = 26;
const routeGradientColors = ["rgba(59,130,246,0.12)", "rgba(168,85,247,0.08)", "rgba(255,255,255,0)"] as const;
const routeRailColor = "#5B6EF5";
const routeTrainAuraColor = "rgba(59, 130, 246, 0.18)";
const routeRailCenterX = routeRailLeftInset + (routeRailWidth / 2);

function formatDistanceLabel(label: string | null, distanceKm: number | null) {
  if (label) {
    return label;
  }

  if (distanceKm === null) {
    return "";
  }

  return `${distanceKm.toFixed(1)} km`;
}

function buildSegmentHeights(stations: MetroJourneyStation[]) {
  return stations.slice(1).map((station) => {
    const distanceKm = station.distanceFromPreviousKm ?? 0;
    return Math.max(routeSegmentMinHeight, Math.round(distanceKm * routePixelsPerKm));
  });
}

function buildStationCenterPositions(segmentHeights: number[]) {
  const centerPositions = [routeRowHalfHeight];
  let current = routeRowHalfHeight;

  for (const height of segmentHeights) {
    current += height;
    centerPositions.push(current);
  }

  return centerPositions;
}

function isVehicleNearStation(station: MetroJourneyStation, vehicles: MetroVehicle[]) {
  return vehicles.some(vehicle => Math.abs(vehicle.percent - station.progress) <= 0.045);
}

function DirectionToggle({
  activeDirectionId,
  options,
  onSelect,
}: {
  activeDirectionId: MetroDirectionId;
  onSelect: (directionId: MetroDirectionId) => void;
  options: MetroDirectionOption[];
}) {
  return (
    <XStack
      backgroundColor="$surfaceMuted"
      borderColor="$borderSubtle"
      borderRadius="$round"
      borderWidth={borderWidths.subtle}
      gap="$2"
      padding="$1.5"
    >
      {options.map((option) => {
        const active = option.directionId === activeDirectionId;

        return (
          <Pressable
            key={option.directionId}
            onPress={() => onSelect(option.directionId)}
            style={({ pressed }) => ({
              flex: 1,
              opacity: pressed ? 0.98 : 1,
              transform: [{ scale: pressed ? 0.992 : 1 }],
            })}
          >
            {() => (
              <YStack
                alignItems="center"
                backgroundColor={active ? "$surfaceDefault" : "transparent"}
                borderRadius="$round"
                paddingHorizontal="$4"
                paddingVertical="$3"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: 8 }}
                shadowOpacity={active ? 0.06 : 0}
                shadowRadius={active ? 12 : 0}
                elevation={active ? 2 : 0}
              >
                <AppText tone={active ? "brand" : "subtle"} variant="tabLabel">
                  {option.label}
                </AppText>
              </YStack>
            )}
          </Pressable>
        );
      })}
    </XStack>
  );
}

function MetroJourneyHeader({
  activeDirectionId,
  activeTrainCount,
  lastUpdatedLabel,
  onBack,
  onSelectDirection,
  options,
}: {
  activeDirectionId: MetroDirectionId;
  activeTrainCount: number;
  lastUpdatedLabel?: string;
  onBack: () => void;
  onSelectDirection: (directionId: MetroDirectionId) => void;
  options: MetroDirectionOption[];
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <YStack
      backgroundColor="$surfaceDefault"
      borderBottomColor="$borderSubtle"
      borderBottomLeftRadius={radii.xxl}
      borderBottomRightRadius={radii.xxl}
      borderBottomWidth={borderWidths.subtle}
      paddingTop={insets.top + 12}
      paddingHorizontal="$5"
      paddingBottom="$5"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <Pressable onPress={onBack} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
          <XStack
            alignItems="center"
            backgroundColor="$surfaceMuted"
            borderColor="$borderSubtle"
            borderRadius="$round"
            borderWidth={borderWidths.subtle}
            height={44}
            justifyContent="center"
            style={elevations.whisper}
            width={44}
          >
            <IconSymbol color={theme.textPrimary.val} name="arrow-left" size="md" />
          </XStack>
        </Pressable>

        <YStack alignItems="center" flex={1} gap="$1" paddingHorizontal="$4">
          <AppText align="center" variant="xlTitle">
            Hành trình Metro
          </AppText>
          <AppText align="center" tone="muted" variant="bodySmall">
            Tuyến metro số 1 Bến Thành - Suối Tiên
          </AppText>
        </YStack>

        <View width={44} />
      </XStack>

      <XStack alignItems="center" justifyContent="space-between" paddingTop="$4">
        <AppText tone="muted" variant="bodySmall">
          {activeTrainCount > 0 ? `${activeTrainCount} tàu đang hoạt động` : "Đang chờ dữ liệu tàu"}
        </AppText>

        {lastUpdatedLabel
          ? (
              <XStack alignItems="center" gap="$2">
                <IconSymbol color={theme.textSecondary.val} name="refresh" size="caption" />
                <AppText tone="subtle" variant="caption">
                  {lastUpdatedLabel}
                </AppText>
              </XStack>
            )
          : null}
      </XStack>

      <YStack paddingTop="$4">
        <DirectionToggle
          activeDirectionId={activeDirectionId}
          onSelect={onSelectDirection}
          options={options}
        />
      </YStack>
    </YStack>
  );
}

function MetroJourneyState({
  description,
  mode,
  onRetry,
  title,
}: {
  description: string;
  mode: "error" | "loading";
  onRetry?: () => void;
  title: string;
}) {
  const theme = useTheme();

  return (
    <YStack flex={1} justifyContent="center" padding="$5">
      <AppCard alignItems="center" borderRadius="$6" gap="$4" padding="$6">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceAccent"
          borderRadius="$round"
          height={68}
          justifyContent="center"
          width={68}
        >
          {mode === "loading"
            ? <ActivityIndicator color={theme.actionPrimary.val} size="large" />
            : <IconSymbol color={theme.actionPrimary.val} name="warning" size="chip" />}
        </YStack>

        <YStack alignItems="center" gap="$2">
          <AppText align="center" variant="headline">
            {title}
          </AppText>
          <AppText align="center" tone="muted" variant="bodySmall">
            {description}
          </AppText>
        </YStack>

        {mode === "error" && onRetry
          ? (
              <AppButton onPress={onRetry} width="100%">
                Thử lại
              </AppButton>
            )
          : null}
      </AppCard>
    </YStack>
  );
}

function MetroJourneyRoute({
  stations,
  vehicles,
  canOpenStationDetail,
  onOpenStationDetail,
}: {
  stations: MetroJourneyStation[];
  vehicles: MetroVehicle[];
  canOpenStationDetail: boolean;
  onOpenStationDetail: (stationName: string) => void;
}) {
  const theme = useTheme();
  const segmentHeights = buildSegmentHeights(stations);
  const stationCenterPositions = buildStationCenterPositions(segmentHeights);
  const totalRouteHeight = stationCenterPositions.at(-1)! - stationCenterPositions[0]!;
  const canvasHeight = stationCenterPositions.at(-1)! + routeRowHalfHeight;

  return (
    <YStack>
      <View height={canvasHeight} position="relative">
        <LinearGradient
          colors={[...routeGradientColors]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
        />

        <View
          backgroundColor="rgba(91, 110, 245, 0.14)"
          borderRadius={radii.round}
          height={totalRouteHeight}
          left={routeRailLeftInset - 5}
          position="absolute"
          top={stationCenterPositions[0]}
          width={routeRailWidth + 10}
        />
        <View
          backgroundColor={routeRailColor}
          borderRadius={radii.round}
          height={totalRouteHeight}
          left={routeRailLeftInset}
          position="absolute"
          top={stationCenterPositions[0]}
          width={routeRailWidth}
        />

        {segmentHeights.map((segmentHeight, index) => {
          const station = stations[index + 1];
          const top = stationCenterPositions[index] + (segmentHeight / 2) - 10;

          return (
            <YStack
              key={`distance-${station.stopId}`}
              left={0}
              position="absolute"
              top={top}
              width={42}
            >
              <AppText align="right" tone="subtle" variant="bodySmall">
                {formatDistanceLabel(station.distanceFromPreviousLabel, station.distanceFromPreviousKm)}
              </AppText>
            </YStack>
          );
        })}

        {vehicles.map((vehicle, index) => {
          const markerTop = stationCenterPositions[0] + (vehicle.percent * totalRouteHeight);

          return (
            <View
              key={`vehicle-${vehicle.coordinate[0]}-${vehicle.coordinate[1]}-${index}`}
              left={routeRailCenterX - (routeTrainAuraSize / 2)}
              position="absolute"
              top={markerTop - (routeTrainAuraSize / 2)}
            >
              <XStack
                alignItems="center"
                backgroundColor={routeTrainAuraColor}
                borderRadius="$round"
                height={routeTrainAuraSize}
                justifyContent="center"
                width={routeTrainAuraSize}
              >
                <XStack
                  alignItems="center"
                  backgroundColor="$actionPrimary"
                  borderColor="$surfaceDefault"
                  borderRadius="$round"
                  borderWidth={2}
                  height={routeTrainMarkerSize}
                  justifyContent="center"
                  shadowColor="$shadowColor"
                  shadowOffset={{ width: 0, height: 8 }}
                  shadowOpacity={0.18}
                  shadowRadius={16}
                  width={routeTrainMarkerSize}
                >
                  <IconSymbol
                    color={theme.onActionPrimary.val}
                    name="train"
                    size="sm"
                    style={{ transform: [{ translateX: 0.5 }] }}
                  />
                </XStack>
              </XStack>
            </View>
          );
        })}

        {stations.map((station, index) => {
          const centerY = stationCenterPositions[index];
          const rowTop = centerY - routeRowHalfHeight;
          const hasNearbyVehicle = isVehicleNearStation(station, vehicles);

          return (
            <Pressable
              key={station.stopId}
              disabled={!canOpenStationDetail}
              onPress={() => {
                onOpenStationDetail(station.internalStationName);
              }}
              style={({ pressed }) => ({
                left: 0,
                opacity: pressed && canOpenStationDetail ? 0.9 : 1,
                position: "absolute",
                right: 0,
                top: rowTop,
              })}
            >
              <View
                backgroundColor="$surfaceDefault"
                borderColor={hasNearbyVehicle ? "$actionPrimary" : "$surfaceDefault"}
                borderRadius="$round"
                borderWidth={2}
                height={routeStationMarkerSize}
                left={routeRailLeftInset - ((routeStationMarkerSize - routeRailWidth) / 2)}
                position="absolute"
                top={routeRowHalfHeight - (routeStationMarkerSize / 2)}
                width={routeStationMarkerSize}
              />

              <XStack alignItems="center" minHeight={routeRowHalfHeight * 2} paddingRight="$3">
                <View width={routeRailLeftInset + routeStationMarkerSize + 18} />

                <YStack flex={1} gap="$1" minWidth={0} paddingRight="$3">
                  <XStack alignItems="center" gap="$2">
                    <AppText tone={hasNearbyVehicle ? "brand" : "default"} variant="cardTitle">
                      {station.name}
                    </AppText>
                  </XStack>
                </YStack>

                <XStack alignItems="center" justifyContent="center" width={routeRowRightInset}>
                  <IconSymbol color={theme.textSecondary.val} name="info" size="sm" />
                </XStack>
              </XStack>
            </Pressable>
          );
        })}
      </View>
    </YStack>
  );
}

export default function MetroJourneyScreen() {
  const theme = useTheme();
  const vm = useMetroJourneyScreen();

  if (vm.isInitialLoading) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        <MetroJourneyHeader
          activeDirectionId={vm.directionId}
          activeTrainCount={0}
          onBack={vm.actions.goBack}
          onSelectDirection={vm.actions.setDirection}
          options={vm.directionOptions}
        />
        <MetroJourneyState
          description="Đang tải tuyến, các ga và vị trí tàu theo thời gian thực."
          mode="loading"
          title="Đang tải hành trình"
        />
      </Screen>
    );
  }

  if (vm.initialError || !vm.data) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        <MetroJourneyHeader
          activeDirectionId={vm.directionId}
          activeTrainCount={0}
          onBack={vm.actions.goBack}
          onSelectDirection={vm.actions.setDirection}
          options={vm.directionOptions}
        />
        <MetroJourneyState
          description={vm.initialError ?? "Không thể tải dữ liệu Metro lúc này."}
          mode="error"
          onRetry={() => {
            void vm.actions.onRefresh();
          }}
          title="Không thể tải hành trình"
        />
      </Screen>
    );
  }

  return (
    <Screen tone="subtle">
      <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />

      <ScrollView
        refreshControl={(
          <RefreshControl
            colors={[theme.actionPrimary.val]}
            onRefresh={() => {
              void vm.actions.onRefresh();
            }}
            refreshing={vm.isRefreshing}
            tintColor={theme.actionPrimary.val}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <YStack paddingBottom="$7">
          <MetroJourneyHeader
            activeDirectionId={vm.directionId}
            activeTrainCount={vm.data.activeTrainCount}
            lastUpdatedLabel={vm.data.lastUpdatedLabel}
            onBack={vm.actions.goBack}
            onSelectDirection={vm.actions.setDirection}
            options={vm.directionOptions}
          />

          <YStack gap="$4" paddingHorizontal="$5" paddingTop="$5">
            <XStack alignItems="center" justifyContent="space-between" paddingRight="$1">
              <AppText tone="subtle" variant="bodySmall">
                {vm.data.directionLabel}
              </AppText>
              <AppText tone="subtle" variant="bodySmall">
                {vm.data.stations.length}
                {" "}
                ga
              </AppText>
            </XStack>

            <MetroJourneyRoute
              canOpenStationDetail={vm.canOpenStationDetail}
              onOpenStationDetail={vm.actions.openStationDetail}
              stations={vm.data.stations}
              vehicles={vm.data.vehicles}
            />

            {vm.refreshError
              ? (
                  <AppCard tone="warning">
                    <AppText variant="cardTitle">
                      Đang hiển thị dữ liệu lần gần nhất
                    </AppText>
                    <AppText tone="muted" variant="bodySmall">
                      {vm.refreshError}
                    </AppText>
                  </AppCard>
                )
              : null}
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
}
