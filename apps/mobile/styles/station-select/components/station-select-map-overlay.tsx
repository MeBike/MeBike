import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

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
  isRouting: boolean;
  hasDestination: boolean;
  hasRoute: boolean;
  onToggleNearby: () => void;
  onOpenList: () => void;
  onBuildRoute: () => void;
  onOpenStationDetail: () => void;
  onClearRoute: () => void;
};

export function StationSelectMapOverlay({
  safeTop,
  showingNearby,
  isLoadingNearbyStations,
  destinationLabel,
  isRouting,
  hasDestination,
  hasRoute,
  onToggleNearby,
  onOpenList,
  onBuildRoute,
  onOpenStationDetail,
  onClearRoute,
}: StationSelectMapOverlayProps) {
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
