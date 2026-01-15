import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { MapboxDirectionsProfile } from "@/lib/mapbox-directions";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: "box-none",
  },
  card: {
    backgroundColor: "transparent",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 0,
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  rowLabel: {
    width: 44,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
  },
  rowValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  modeButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "white",
  },
  smallButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  smallButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },
  primaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    alignItems: "center",
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "white",
  },
  routeSummary: {
    marginTop: 10,
    alignSelf: "center",
  },
  routeSummaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.92)",
  },
  detailLink: {
    marginTop: 10,
    alignSelf: "center",
  },
  detailLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },
});

type StationSelectMapOverlayProps = {
  safeTop: number;
  showingNearby: boolean;
  isLoadingNearbyStations: boolean;
  destinationLabel: string;
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

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0)
    return "";
  if (meters < 1000)
    return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const formatted = km < 10 ? km.toFixed(1) : km.toFixed(0);
  return `${formatted} km`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0)
    return "";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60)
    return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0)
    return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
}

export function StationSelectMapOverlay({
  safeTop,
  showingNearby,
  isLoadingNearbyStations,
  destinationLabel,
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
  const routeSummary = hasRoute && routeDistanceMeters && routeDurationSeconds
    ? `${formatDistance(routeDistanceMeters)} • ${formatDuration(routeDurationSeconds)}`
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <LinearGradient
          colors={[BikeColors.primary, BikeColors.secondary]}
          style={styles.gradient}
        >
          <View style={[styles.topRow, { paddingTop: safeTop }]}>
            <View />
          </View>

          <View style={styles.row}>
            <Ionicons name="navigate" size={16} color="white" />
            <Text style={styles.rowLabel}>Đi từ</Text>
            <Text style={styles.rowValue}>Vị trí hiện tại</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="location" size={16} color="white" />
            <Text style={styles.rowLabel}>Đến</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {destinationLabel}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.smallButton} onPress={onOpenList}>
              <Ionicons name="list" size={16} color="white" />
              <Text style={styles.smallButtonText}>Danh sách</Text>
            </Pressable>

            <Pressable
              style={styles.smallButton}
              onPress={onToggleNearby}
              disabled={isLoadingNearbyStations}
            >
              {isLoadingNearbyStations
                ? <ActivityIndicator size="small" color="white" />
                : <Ionicons name="locate" size={16} color="white" />}
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
              <Ionicons name="walk" size={16} color="white" />
              <Text style={styles.modeButtonText}>Đi bộ</Text>
            </Pressable>

            <Pressable
              style={[styles.modeButton, routeProfile === "cycling" && styles.modeButtonActive]}
              onPress={() => onChangeRouteProfile("cycling")}
              disabled={isRouting}
            >
              <Ionicons name="bicycle" size={16} color="white" />
              <Text style={styles.modeButtonText}>Xe đạp</Text>
            </Pressable>

            <Pressable
              style={[styles.modeButton, routeProfile === "driving" && styles.modeButtonActive]}
              onPress={() => onChangeRouteProfile("driving")}
              disabled={isRouting}
            >
              <Ionicons name="car" size={16} color="white" />
              <Text style={styles.modeButtonText}>Ô tô</Text>
            </Pressable>
          </View>

          <View style={styles.primaryRow}>
            <Pressable
              style={[styles.primaryButton, (!hasDestination || isRouting) && styles.primaryButtonDisabled]}
              onPress={onBuildRoute}
              disabled={!hasDestination || isRouting}
            >
              {isRouting
                ? <ActivityIndicator size="small" color="white" />
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
                <Pressable style={styles.detailLink} onPress={onOpenStationDetail}>
                  <Text style={styles.detailLinkText}>Xem chi tiết trạm</Text>
                </Pressable>
              )
            : null}
        </LinearGradient>
      </View>
    </View>
  );
}
