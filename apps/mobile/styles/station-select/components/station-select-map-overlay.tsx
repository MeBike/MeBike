import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, PanResponder, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { MapboxDirectionsProfile } from "@/lib/mapbox-directions";
import { styles } from "./station-select-map-overlay.styles";
import { formatDistance, formatDuration } from "./station-select-map-overlay.utils";

type StationSelectMapOverlayProps = {
  safeBottom: number;
  showingNearby: boolean;
  isLoadingNearbyStations: boolean;
  destinationLabel: string;
  selectedStationAddress?: string | null;
  selectedStationAvailableBikes?: number | null;
  routeProfile: MapboxDirectionsProfile;
  routeDistanceMeters?: number | null;
  routeDurationSeconds?: number | null;
  isRouting: boolean;
  hasDestination: boolean;
  hasRoute: boolean;
  onToggleNearby: () => void;
  onOpenList: () => void;
  onBuildRoute: () => void;
  onChangeRouteProfile: (profile: MapboxDirectionsProfile) => void;
  onOpenStationDetail: () => void;
  onClearRoute: () => void;
};

export function StationSelectMapOverlay({
  safeBottom,
  showingNearby,
  isLoadingNearbyStations,
  destinationLabel,
  selectedStationAddress,
  selectedStationAvailableBikes,
  routeProfile,
  routeDistanceMeters,
  routeDurationSeconds,
  isRouting,
  hasDestination,
  hasRoute,
  onToggleNearby,
  onOpenList,
  onBuildRoute,
  onChangeRouteProfile,
  onOpenStationDetail,
  onClearRoute,
}: StationSelectMapOverlayProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const expandProgress = useSharedValue(0);
  const dragStartProgressRef = React.useRef(0);
  const draggedRef = React.useRef(false);
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
    if (hasDestination) {
      setIsExpanded(true);
      animateTo(1);
    }
  }, [animateTo, hasDestination]);

  const chevronAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(expandProgress.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const compactAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - expandProgress.value,
    maxHeight: interpolate(expandProgress.value, [0, 1], [64, 0]),
    transform: [{ translateY: interpolate(expandProgress.value, [0, 1], [0, -6]) }],
  }));

  const expandedAnimatedStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    maxHeight: interpolate(expandProgress.value, [0, 1], [0, 320]),
    transform: [{ translateY: interpolate(expandProgress.value, [0, 1], [8, 0]) }],
  }));

  const handlePanResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2,
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
  }), [animateTo, expandProgress]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(safeBottom, 8) }]}>
      <Animated.View style={styles.sheet}>
        <View style={styles.handleWrap} {...handlePanResponder.panHandlers}>
          <Pressable style={styles.handleTouchArea} onPress={toggleExpanded}>
            <View style={styles.handle} />
          </Pressable>
        </View>

        <Pressable onPress={toggleExpanded} {...handlePanResponder.panHandlers}>
          <View style={styles.headerButton}>
            <View style={styles.titleGroup}>
              <Text style={styles.title}>
                {hasDestination ? "Lộ trình đến trạm" : "Chọn trạm trên bản đồ"}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {hasDestination ? destinationLabel : "Chạm vào pin trạm để bắt đầu"}
              </Text>
            </View>
            <Animated.View style={chevronAnimatedStyle}>
              <Ionicons name="chevron-up" size={20} color={BikeColors.textSecondary} />
            </Animated.View>
          </View>
        </Pressable>

        <Animated.View style={[styles.compactActionsWrap, compactAnimatedStyle]}>
          <View style={styles.compactActions}>
            <Pressable style={styles.compactChip} onPress={onOpenList}>
              <Ionicons name="list" size={16} color={BikeColors.textPrimary} />
              <Text style={styles.compactChipText}>Danh sách</Text>
            </Pressable>

            <Pressable
              style={[styles.compactChip, showingNearby && styles.compactChipActive]}
              onPress={onToggleNearby}
              disabled={isLoadingNearbyStations}
            >
              {isLoadingNearbyStations
                ? <ActivityIndicator size="small" color={BikeColors.primary} />
                : <Ionicons name="locate" size={16} color={BikeColors.primary} />}
              <Text style={styles.compactChipText}>
                {showingNearby ? "Tất cả" : "Gần tôi"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={[styles.expandedSection, expandedAnimatedStyle]}>
          <View style={styles.row}>
            <Ionicons name="navigate" size={16} color={BikeColors.primary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Đi từ</Text>
              <Text style={styles.rowValue}>Vị trí hiện tại</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="location" size={16} color={BikeColors.primary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Đến</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {destinationLabel}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.smallButton} onPress={onOpenList}>
              <Ionicons name="list" size={16} color={BikeColors.textPrimary} />
              <Text style={styles.smallButtonText}>Danh sách</Text>
            </Pressable>

            <Pressable
              style={[styles.smallButton, showingNearby && styles.smallButtonActive]}
              onPress={onToggleNearby}
              disabled={isLoadingNearbyStations}
            >
              {isLoadingNearbyStations
                ? <ActivityIndicator size="small" color={BikeColors.primary} />
                : <Ionicons name="locate" size={16} color={BikeColors.primary} />}
              <Text style={styles.smallButtonText}>
                {showingNearby ? "Tất cả" : "Gần tôi"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeButton, routeProfile === "walking" && styles.modeButtonActive]}
              onPress={() => onChangeRouteProfile("walking")}
              disabled={isRouting}
            >
              <Ionicons
                name="walk"
                size={16}
                color={routeProfile === "walking" ? BikeColors.primary : BikeColors.textSecondary}
              />
              <Text style={styles.modeButtonText}>Đi bộ</Text>
            </Pressable>

            <Pressable
              style={[styles.modeButton, routeProfile === "cycling" && styles.modeButtonActive]}
              onPress={() => onChangeRouteProfile("cycling")}
              disabled={isRouting}
            >
              <Ionicons
                name="bicycle"
                size={16}
                color={routeProfile === "cycling" ? BikeColors.primary : BikeColors.textSecondary}
              />
              <Text style={styles.modeButtonText}>Xe đạp</Text>
            </Pressable>

            <Pressable
              style={[styles.modeButton, routeProfile === "driving" && styles.modeButtonActive]}
              onPress={() => onChangeRouteProfile("driving")}
              disabled={isRouting}
            >
              <Ionicons
                name="car"
                size={16}
                color={routeProfile === "driving" ? BikeColors.primary : BikeColors.textSecondary}
              />
              <Text style={styles.modeButtonText}>Ô tô</Text>
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.primaryRow}>
          <Pressable
            style={[styles.primaryButton, (!hasDestination || isRouting) && styles.primaryButtonDisabled]}
            onPress={onBuildRoute}
            disabled={!hasDestination || isRouting}
          >
            {isRouting
              ? <ActivityIndicator size="small" color={BikeColors.onPrimary} />
              : <Text style={styles.primaryButtonText}>Tìm đường</Text>}
          </Pressable>

          {hasRoute
            ? (
                <Pressable style={styles.secondaryButton} onPress={onClearRoute}>
                  <Text style={styles.secondaryButtonText}>Xóa</Text>
                </Pressable>
              )
            : null}
        </View>

        {routeSummary
          ? (
              <View style={styles.routeSummary}>
                <Text style={styles.routeSummaryText}>{routeSummary}</Text>
              </View>
            )
          : null}

        {hasDestination
          ? (
              <View style={styles.stationCard}>
                <View style={styles.stationInfoRow}>
                  <Text style={styles.stationName} numberOfLines={1}>
                    {destinationLabel}
                  </Text>
                  {typeof selectedStationAvailableBikes === "number"
                    ? (
                        <Text style={styles.stationMeta}>
                          {selectedStationAvailableBikes}
                          {" "}
                          xe khả dụng
                        </Text>
                      )
                    : null}
                </View>

                {selectedStationAddress
                  ? (
                      <Text style={styles.stationAddress} numberOfLines={1}>
                        {selectedStationAddress}
                      </Text>
                    )
                  : null}

                <Pressable style={styles.detailButton} onPress={onOpenStationDetail}>
                  <Text style={styles.detailButtonText}>Xem chi tiết trạm</Text>
                </Pressable>
              </View>
            )
          : null}
      </Animated.View>
    </View>
  );
}
