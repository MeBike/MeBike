import React from "react";
import { PanResponder, Pressable, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme, XStack, YStack } from "tamagui";

import type { MapboxDirectionsProfile } from "@/lib/mapbox-directions";

import { borderWidths } from "@theme/metrics";
import { IconSymbol } from "@components/IconSymbol";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

import { StationSelectDiscoveryActions } from "./station-select-discovery-actions";
import { formatDistance, formatDuration } from "./station-select-map-overlay.utils";
import { StationSelectPreviewCard } from "./station-select-preview-card";
import { StationSelectRoutingPanel } from "./station-select-routing-panel";

type StationSelectMapOverlayProps = {
  safeBottom: number;
  showingNearby: boolean;
  isLoadingNearbyStations: boolean;
  isResolvingNearbyLocation: boolean;
  isRefreshingLocation: boolean;
  destinationLabel: string;
  selectedStationAddress?: string | null;
  selectedStationAvailableBikes?: number | null;
  routeProfile: MapboxDirectionsProfile;
  routeDistanceMeters?: number | null;
  routeDurationSeconds?: number | null;
  isRouting: boolean;
  hasDestination: boolean;
  isRoutingMode: boolean;
  hasRoute: boolean;
  onLocateUser: () => void;
  onToggleNearby: () => void;
  onOpenList: () => void;
  onEnterRoutingMode: () => void;
  onBuildRoute: () => void;
  onChangeRouteProfile: (profile: MapboxDirectionsProfile) => void;
  onOpenStationDetail: () => void;
  onResetSelection: () => void;
  onClearRoute: () => void;
};

export function StationSelectMapOverlay({
  safeBottom,
  showingNearby,
  isLoadingNearbyStations,
  isResolvingNearbyLocation,
  isRefreshingLocation,
  destinationLabel,
  selectedStationAddress,
  selectedStationAvailableBikes,
  routeProfile,
  routeDistanceMeters,
  routeDurationSeconds,
  isRouting,
  hasDestination,
  isRoutingMode,
  hasRoute,
  onLocateUser,
  onToggleNearby,
  onOpenList,
  onEnterRoutingMode,
  onBuildRoute,
  onChangeRouteProfile,
  onOpenStationDetail,
  onResetSelection,
  onClearRoute,
}: StationSelectMapOverlayProps) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const expandProgress = useSharedValue(0);
  const dragStartProgressRef = React.useRef(0);
  const draggedRef = React.useRef(false);

  const showDiscoveryActions = !hasDestination;
  const showStationPreview = hasDestination && !isRoutingMode;
  const showRouting = hasDestination && isRoutingMode;

  const routeSummary = hasRoute && routeDistanceMeters && routeDurationSeconds
    ? `${formatDistance(routeDistanceMeters)} • ${formatDuration(routeDurationSeconds)}`
    : null;

  const animateTo = React.useCallback((target: 0 | 1) => {
    expandProgress.value = withTiming(target, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [expandProgress]);

  const toggleExpanded = React.useCallback(() => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }

    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    animateTo(nextExpanded ? 1 : 0);
  }, [animateTo, isExpanded]);

  React.useEffect(() => {
    if (showRouting) {
      setIsExpanded(true);
      animateTo(1);
      return;
    }

    setIsExpanded(false);
    animateTo(0);
  }, [animateTo, showRouting]);

  const compactAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - expandProgress.value,
    maxHeight: interpolate(expandProgress.value, [0, 1], [80, 0]),
    transform: [{ translateY: interpolate(expandProgress.value, [0, 1], [0, -6]) }],
  }));

  const expandedAnimatedStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    maxHeight: interpolate(expandProgress.value, [0, 1], [0, 420]),
    transform: [{ translateY: interpolate(expandProgress.value, [0, 1], [8, 0]) }],
  }));

  const handlePanResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => showRouting && Math.abs(gestureState.dy) > 2,
    onPanResponderGrant: () => {
      dragStartProgressRef.current = expandProgress.value;
      draggedRef.current = false;
    },
    onPanResponderMove: (_, gestureState) => {
      if (Math.abs(gestureState.dy) > 2) {
        draggedRef.current = true;
      }

      const nextProgress = dragStartProgressRef.current - (gestureState.dy / 260);
      expandProgress.value = Math.max(0, Math.min(1, nextProgress));
    },
    onPanResponderRelease: (_, gestureState) => {
      const shouldExpand = expandProgress.value > 0.5 || gestureState.vy < -0.35;
      const target: 0 | 1 = shouldExpand ? 1 : 0;
      setIsExpanded(target === 1);
      animateTo(target);
      setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    },
    onPanResponderTerminate: () => {
      const target: 0 | 1 = expandProgress.value >= 0.5 ? 1 : 0;
      setIsExpanded(target === 1);
      animateTo(target);
      setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    },
  }), [animateTo, expandProgress, showRouting]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      <Animated.View style={{ overflow: "hidden" }}>
        <AppCard
          borderColor="$borderSubtle"
          borderTopLeftRadius="$5"
          borderTopRightRadius="$5"
          borderBottomLeftRadius="$0"
          borderBottomRightRadius="$0"
          borderTopWidth={borderWidths.subtle}
          chrome="flat"
          padding="$0"
          paddingBottom={safeBottom}
        >
          <View
            style={{
              alignItems: "center",
              paddingTop: 8,
              paddingBottom: 4,
            }}
            {...(showRouting ? handlePanResponder.panHandlers : undefined)}
          >
            <Pressable
              onPress={showRouting ? toggleExpanded : undefined}
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 6,
                paddingHorizontal: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 5,
                  borderRadius: 999,
                  backgroundColor: theme.borderSubtle.val,
                }}
              />
            </Pressable>
          </View>

          {showStationPreview
            ? null
            : (
                <Pressable onPress={showRouting ? toggleExpanded : undefined} {...(showRouting ? handlePanResponder.panHandlers : undefined)}>
                  <XStack alignItems="center" justifyContent="space-between" gap="$3" paddingHorizontal="$5" paddingBottom="$4">
                    <YStack flex={1} gap="$1">
                      <AppText variant="title">
                        {showRouting
                          ? "Lộ trình đến trạm"
                          : "Chọn trạm trên bản đồ"}
                      </AppText>
                      <AppText numberOfLines={1} tone="muted" variant="bodySmall">
                        {showRouting ? destinationLabel : "Chạm vào pin trạm để xem chi tiết"}
                      </AppText>
                    </YStack>

                    {!showRouting
                      ? (
                          <Pressable disabled={isRefreshingLocation} hitSlop={8} onPress={() => void onLocateUser()}>
                            <AppCard
                              alignItems="center"
                              backgroundColor="$surfaceMuted"
                              borderRadius="$round"
                              chrome="flat"
                              height={40}
                              justifyContent="center"
                              opacity={isRefreshingLocation ? 0.7 : 1}
                              padding="$0"
                              width={40}
                            >
                              <IconSymbol
                                color={isRefreshingLocation ? theme.textSecondary.val : theme.textPrimary.val}
                                name="location"
                                size="input"
                              />
                            </AppCard>
                          </Pressable>
                        )
                      : null}

                  </XStack>
                </Pressable>
              )}

          {showDiscoveryActions
            ? (
                <Animated.View style={[{ overflow: "hidden" }, compactAnimatedStyle]}>
                  <StationSelectDiscoveryActions
                    showingNearby={showingNearby}
                    isLoadingNearbyStations={isLoadingNearbyStations || isResolvingNearbyLocation}
                    onOpenList={onOpenList}
                    onToggleNearby={onToggleNearby}
                  />
                </Animated.View>
              )
            : null}

          {showStationPreview
            ? (
                <StationSelectPreviewCard
                  destinationLabel={destinationLabel}
                  selectedStationAddress={selectedStationAddress}
                  selectedStationAvailableBikes={selectedStationAvailableBikes}
                  onEnterRoutingMode={onEnterRoutingMode}
                  onOpenStationDetail={onOpenStationDetail}
                />
              )
            : null}

          {showRouting
            ? (
                <Animated.View style={[{ overflow: "hidden" }, expandedAnimatedStyle]}>
                  <StationSelectRoutingPanel
                    destinationLabel={destinationLabel}
                    routeProfile={routeProfile}
                    routeSummary={routeSummary}
                    isRouting={isRouting}
                    hasDestination={hasDestination}
                    hasRoute={hasRoute}
                    onChangeRouteProfile={onChangeRouteProfile}
                    onResetSelection={onResetSelection}
                    onBuildRoute={onBuildRoute}
                    onClearRoute={onClearRoute}
                  />
                </Animated.View>
              )
            : null}
        </AppCard>
      </Animated.View>
    </View>
  );
}
