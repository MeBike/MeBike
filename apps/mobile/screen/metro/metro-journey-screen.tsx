import type { MetroDirectionId, MetroDirectionOption, MetroJourneyStation, MetroVehicle } from "@services/metro";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations, radii } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, View, XStack, YStack } from "tamagui";

import { useMetroJourneyScreen } from "./hooks/use-metro-journey-screen";

const routeCanvasColor = "#EEF0FA";
const routeRailColor = "#4B6BFB";
const routeRailWidth = 8;
const routeStationMarkerSize = 18;
const routeTrainMarkerSize = 28;
const routeRowHalfHeight = 36;
const routeSegmentMinHeight = 82;
const routePixelsPerKm = 56;
const routeDistanceColumnWidth = 54;
const routeRailLeftInset = 62;
const routeContentGap = 24;
const routeInfoWidth = 28;
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

function splitDistanceLabel(label: string) {
  const [value = "", unit = ""] = label.split(" ");
  return { unit, value };
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

function HeaderActionButton({
  icon,
  onPress,
  loading = false,
}: {
  icon: "arrow-left" | "refresh";
  loading?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <XStack
        alignItems="center"
        backgroundColor="$surfaceDefault"
        borderColor="$borderSubtle"
        borderRadius="$round"
        borderWidth={borderWidths.subtle}
        height={44}
        justifyContent="center"
        style={elevations.whisper}
        width={44}
      >
        {loading
          ? <ActivityIndicator color={theme.textSecondary.val} size="small" />
          : <IconSymbol color={theme.textSecondary.val} name={icon} size="md" />}
      </XStack>
    </Pressable>
  );
}

function DirectionToggle({
  activeDirectionId,
  onSelect,
  options,
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
      gap="$1"
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
              <XStack
                alignItems="center"
                backgroundColor={active ? "$surfaceDefault" : "transparent"}
                borderRadius="$round"
                justifyContent="center"
                minHeight={52}
                paddingHorizontal="$4"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: 4 }}
                shadowOpacity={active ? 0.08 : 0}
                shadowRadius={active ? 10 : 0}
                elevation={active ? 2 : 0}
              >
                <AppText tone={active ? "brand" : "muted"} variant="tabLabel">
                  {option.label}
                </AppText>
              </XStack>
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
  isRefreshing,
  lastUpdatedLabel,
  onBack,
  onRefresh,
  onSelectDirection,
  options,
}: {
  activeDirectionId: MetroDirectionId;
  activeTrainCount: number;
  isRefreshing: boolean;
  lastUpdatedLabel?: string;
  onBack: () => void;
  onRefresh: () => void;
  onSelectDirection: (directionId: MetroDirectionId) => void;
  options: MetroDirectionOption[];
}) {
  const insets = useSafeAreaInsets();

  return (
    <YStack
      backgroundColor="$surfaceDefault"
      borderBottomLeftRadius={radii.xxl}
      borderBottomRightRadius={radii.xxl}
      paddingTop={insets.top + 12}
      paddingHorizontal="$5"
      paddingBottom="$5"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <HeaderActionButton icon="arrow-left" onPress={onBack} />

        <YStack alignItems="center" flex={1} gap="$1" paddingHorizontal="$4">
          <AppText align="center" variant="xlTitle">
            Hành trình Metro
          </AppText>
          <AppText align="center" tone="muted" variant="bodySmall">
            Tuyến metro số 1 Bến Thành - Suối Tiên
          </AppText>
        </YStack>

        <HeaderActionButton icon="refresh" loading={isRefreshing} onPress={onRefresh} />
      </XStack>

      <XStack alignItems="center" justifyContent="space-between" paddingTop="$5">
        <AppText tone="muted" variant="subhead">
          {activeTrainCount > 0 ? `${activeTrainCount} tàu đang hoạt động` : "Đang chờ dữ liệu tàu"}
        </AppText>

        <XStack alignItems="center" gap="$2">
          <IconSymbol color="$textSecondary" name="refresh" size="caption" />
          <AppText tone="muted" variant="caption">
            {lastUpdatedLabel ?? "--:--"}
          </AppText>
        </XStack>
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
    <YStack backgroundColor={routeCanvasColor} flex={1} justifyContent="center" padding="$5">
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
  canOpenStationDetail,
  onOpenStationDetail,
  stations,
  vehicles,
}: {
  canOpenStationDetail: boolean;
  onOpenStationDetail: (stationName: string) => void;
  stations: MetroJourneyStation[];
  vehicles: MetroVehicle[];
}) {
  const theme = useTheme();
  const segmentHeights = buildSegmentHeights(stations);
  const stationCenterPositions = buildStationCenterPositions(segmentHeights);
  const totalRouteHeight = stationCenterPositions.at(-1)! - stationCenterPositions[0]!;
  const canvasHeight = stationCenterPositions.at(-1)! + routeRowHalfHeight;

  return (
    <View backgroundColor={routeCanvasColor} height={canvasHeight} position="relative">
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
        const top = stationCenterPositions[index] + (segmentHeight / 2) - 16;
        const { unit, value } = splitDistanceLabel(
          formatDistanceLabel(station.distanceFromPreviousLabel, station.distanceFromPreviousKm),
        );

        return (
          <YStack
            key={`distance-${station.stopId}`}
            alignItems="flex-end"
            left={0}
            position="absolute"
            top={top}
            width={routeDistanceColumnWidth}
          >
            <AppText align="right" tone="subtle" variant="subhead">
              {value}
            </AppText>
            <AppText align="right" tone="subtle" variant="subhead">
              {unit}
            </AppText>
          </YStack>
        );
      })}

      {vehicles.map((vehicle, index) => {
        const markerTop = stationCenterPositions[0] + (vehicle.percent * totalRouteHeight);

        return (
          <View
            key={`vehicle-${vehicle.coordinate[0]}-${vehicle.coordinate[1]}-${index}`}
            left={routeRailCenterX - (routeTrainMarkerSize / 2)}
            pointerEvents="none"
            position="absolute"
            top={markerTop - (routeTrainMarkerSize / 2)}
          >
            <XStack
              alignItems="center"
              justifyContent="center"
              width={routeTrainMarkerSize}
            >
              <XStack
                alignItems="center"
                backgroundColor={routeRailColor}
                borderColor="$surfaceDefault"
                borderRadius="$round"
                borderWidth={2}
                height={routeTrainMarkerSize}
                justifyContent="center"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: 6 }}
                shadowOpacity={0.18}
                shadowRadius={12}
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

        return (
          <Pressable
            key={station.stopId}
            disabled={!canOpenStationDetail}
            onPress={() => {
              onOpenStationDetail(station.internalStationName);
            }}
            style={({ pressed }) => ({
              left: 0,
              opacity: pressed && canOpenStationDetail ? 0.88 : 1,
              position: "absolute",
              right: 0,
              top: rowTop,
            })}
          >
            <View
              backgroundColor="$surfaceDefault"
              borderColor={routeRailColor}
              borderRadius="$round"
              borderWidth={4}
              height={routeStationMarkerSize}
              left={routeRailCenterX - (routeStationMarkerSize / 2)}
              position="absolute"
              top={routeRowHalfHeight - (routeStationMarkerSize / 2)}
              width={routeStationMarkerSize}
            />

            <XStack alignItems="center" minHeight={routeRowHalfHeight * 2} paddingRight="$2">
              <View width={routeRailLeftInset + routeStationMarkerSize + routeContentGap} />

              <YStack flex={1} minWidth={0} paddingRight="$3">
                <AppText variant="cardTitle">
                  {station.name}
                </AppText>
              </YStack>

              <XStack alignItems="center" justifyContent="center" width={routeInfoWidth}>
                <IconSymbol color={theme.textSecondary.val} name="info" size="input" />
              </XStack>
            </XStack>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MetroJourneyScreen() {
  const theme = useTheme();
  const vm = useMetroJourneyScreen();

  if (vm.isInitialLoading) {
    return (
      <Screen backgroundColor="$surfaceDefault">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        <MetroJourneyHeader
          activeDirectionId={vm.directionId}
          activeTrainCount={0}
          isRefreshing={false}
          onBack={vm.actions.goBack}
          onRefresh={() => {
            void vm.actions.onRefresh();
          }}
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
      <Screen backgroundColor="$surfaceDefault">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        <MetroJourneyHeader
          activeDirectionId={vm.directionId}
          activeTrainCount={0}
          isRefreshing={vm.isRefreshing}
          onBack={vm.actions.goBack}
          onRefresh={() => {
            void vm.actions.onRefresh();
          }}
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
    <Screen backgroundColor="$surfaceDefault">
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
        <MetroJourneyHeader
          activeDirectionId={vm.directionId}
          activeTrainCount={vm.data.activeTrainCount}
          isRefreshing={vm.isRefreshing}
          lastUpdatedLabel={vm.data.lastUpdatedLabel}
          onBack={vm.actions.goBack}
          onRefresh={() => {
            void vm.actions.onRefresh();
          }}
          onSelectDirection={vm.actions.setDirection}
          options={vm.directionOptions}
        />

        <YStack backgroundColor={routeCanvasColor} paddingBottom="$7">
          <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$5" paddingTop="$5" paddingBottom="$4">
            <AppText tone="muted" variant="subhead">
              {vm.data.directionLabel}
            </AppText>
            <AppText tone="muted" variant="subhead">
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
                <YStack paddingHorizontal="$5" paddingTop="$4">
                  <AppCard tone="warning">
                    <AppText variant="cardTitle">
                      Đang hiển thị dữ liệu lần gần nhất
                    </AppText>
                    <AppText tone="muted" variant="bodySmall">
                      {vm.refreshError}
                    </AppText>
                  </AppCard>
                </YStack>
              )
            : null}
        </YStack>
      </ScrollView>
    </Screen>
  );
}
