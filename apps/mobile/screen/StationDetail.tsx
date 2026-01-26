import { LoadingScreen } from "@components/LoadingScreen";
import StationMap2D from "@components/StationMap2D";
import { Ionicons } from "@expo/vector-icons";
import { useBikeActions } from "@hooks/use-bike-action";
import { useStationActions } from "@hooks/useStationAction";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Bike } from "../types/BikeTypes";
import type {
  StationDetailRouteProp,
  StationDetailScreenNavigationProp,
} from "../types/navigation";
import type { StationType } from "../types/StationType";

import { IconSymbol } from "../components/IconSymbol";
import { BikeColors } from "../constants/BikeColors";

const { width: screenWidth } = Dimensions.get("window");
const MAP_PADDING = 20;
const MAP_WIDTH = screenWidth - MAP_PADDING * 2;
const MAP_HEIGHT = 300;

export default function StationDetailScreen() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const route = useRoute<StationDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { stationId } = route.params;
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedBikes, setLoadedBikes] = useState<Bike[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bikeId, setBikeID] = useState<string | undefined>(undefined);
  const [focusedBike, setFocusedBike] = useState<Bike | null>(null);

  const { getStationByID, responseStationDetail, isLoadingGetStationByID } =
    useStationActions(true, stationId);

  const { allBikes, isFetchingAllBikes, getBikes, totalRecords } =
    useBikeActions({
      hasToken: true,
      bike_id: bikeId,
      station_id: stationId,
      page: currentPage,
      limit,
    });

  useEffect(() => {
    if (stationId) {
      getStationByID();
      getBikes();
    }
  }, [stationId, currentPage, getStationByID, getBikes]);

  useEffect(() => {
    if (allBikes && allBikes.length > 0) {
      if (currentPage === 1) {
        setLoadedBikes(allBikes);
      } else {
        setLoadedBikes((prev) => [...prev, ...allBikes]);
      }
      setHasMore(allBikes.length === limit);
    } else if (currentPage > 1) {
      setHasMore(false);
    }
    if (refreshing) setRefreshing(false);
  }, [allBikes, currentPage, limit, refreshing]);

  const station = responseStationDetail as StationType | null;
  const isLoading = isLoadingGetStationByID || isFetchingAllBikes;

  const handleBikePress = useCallback(
    (bike: Bike) => {
      if (!station) return;
      setFocusedBike(bike);
      navigation.navigate("BikeDetail", {
        bike,
        station: {
          id: stationId,
          name: station.name,
          address: station.address,
        },
      });
    },
    [navigation, station, stationId],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    setLoadedBikes([]);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!station) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy trạm</Text>
      </View>
    );
  }
  const handleLoadMore = () => {
    if (hasMore && !isFetchingAllBikes) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[BikeColors.primary]}
            tintColor={BikeColors.primary}
          />
        }
      >
        <LinearGradient
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết thuê xe</Text>
        </LinearGradient>
        <View style={styles.stationInfo}>
          <View style={styles.stationHeader}>
            <IconSymbol
              name="building.2.fill"
              size={32}
              color={BikeColors.primary}
            />
            <View style={styles.stationDetails}>
              <Text style={styles.stationName}>{station.name}</Text>
              <Text style={styles.stationAddress}>{station.address}</Text>
              {station.total_ratings !== undefined ? (
                station.total_ratings > 0 ? (
                  <Text style={styles.stationRating}>
                    ⭐ {station.average_rating?.toFixed(1)} (
                    {station.total_ratings} đánh giá)
                  </Text>
                ) : (
                  <Text style={styles.stationRating}>Chưa có đánh giá</Text>
                )
              ) : null}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: BikeColors.success },
              ]}
            >
              <Text style={styles.statusText}>Hoạt động</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.fixedSlotBanner}
          onPress={() =>
            navigation.navigate("FixedSlotTemplates", {
              stationId,
              stationName: station.name,
            })
          }
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.fixedSlotTitle}>Khung giờ cố định</Text>
            <Text style={styles.fixedSlotSubtitle}>
              Tạo hoặc quản lý khung giờ để giữ xe nhanh hơn.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <IconSymbol
              name="bicycle.circle.fill"
              size={24}
              color={BikeColors.primary}
            />
            <Text style={styles.statNumber}>{station.totalBikes}</Text>
            <Text style={styles.statLabel}>Tổng số Xe</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol
              name="bicycle.circle.fill"
              size={24}
              color={BikeColors.success}
            />
            <Text style={styles.statNumber}>{station.availableBikes}</Text>
            <Text style={styles.statLabel}>Xe có sẵn</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol name="person.fill" size={24} color={BikeColors.error} />
            <Text style={styles.statNumber}>{station.bookedBikes}</Text>
            <Text style={styles.statLabel}>Xe đang thuê</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol name="gear" size={24} color={BikeColors.primary} />
            <Text style={styles.statNumber}>{station.reservedBikes}</Text>
            <Text style={styles.statLabel}>Xe đã được đặt trước</Text>
          </View>
        </View>

        <StationMap2D
          station={station}
          bikes={allBikes}
          selectedBike={focusedBike}
          onBikePress={handleBikePress}
        />

        {loadedBikes && loadedBikes.length > 0 ? (
          <View style={styles.bikeListSection}>
            <Text style={styles.sectionTitle}>
              Danh sách xe ({loadedBikes.length})
            </Text>
            {loadedBikes.map((bike: Bike, index: number) => {
              const isAvailable = bike.status === "CÓ SẴN";
              return (
                <TouchableOpacity
                  key={`${bike._id}-${index}`}
                  style={styles.bikeItem}
                  onPress={() => handleBikePress(bike)}
                  activeOpacity={0.85}
                >
                  {/* Trái: Hiển thị thông tin xe */}
                  <View style={styles.bikeItemLeft}>
                    <View
                      style={[
                        styles.bikeStatusIndicator,
                        {
                          backgroundColor: isAvailable
                            ? BikeColors.success
                            : BikeColors.error,
                        },
                      ]}
                    />
                    <View>
                      <Text style={styles.bikeId}>
                        ChipID: #{bike.chip_id || bike._id.slice(-4)}
                      </Text>
                      <Text style={styles.bikeType}>Xe thường</Text>
                      {bike.total_ratings !== undefined ? (
                        bike.total_ratings > 0 ? (
                          <Text style={styles.bikeRating}>
                            ⭐ {bike.average_rating?.toFixed(1)} (
                            {bike.total_ratings})
                          </Text>
                        ) : (
                          <Text style={styles.bikeRating}>
                            Chưa có đánh giá
                          </Text>
                        )
                      ) : null}
                    </View>
                  </View>

                  {/* Phải: trạng thái */}
                  <View style={styles.bikeItemRight}>
                    <Text
                      style={[
                        styles.bikeStatus,
                        {
                          color: isAvailable
                            ? BikeColors.success
                            : BikeColors.error,
                        },
                      ]}
                    >
                      {isAvailable ? "Có sẵn" : "Đang thuê"}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={BikeColors.onSurfaceVariant}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
            {hasMore && loadedBikes.length <= totalRecords && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={isFetchingAllBikes}
              >
                {isFetchingAllBikes ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loadMoreButtonText}>Tải thêm xe</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Xe đang được thuê hết</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BikeColors.background,
  },
  errorText: {
    fontSize: 18,
    color: BikeColors.error,
  },
  backButton: {
    padding: 8,
  },
  stationInfo: {
    backgroundColor: BikeColors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  fixedSlotBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: BikeColors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fixedSlotTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  fixedSlotSubtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    fontSize: 13,
  },
  stationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stationDetails: {
    flex: 1,
  },
  stationName: {
    fontSize: 20,
    fontWeight: "600",
    color: BikeColors.onSurface,
  },
  stationAddress: {
    fontSize: 14,
    color: BikeColors.onSurfaceVariant,
    marginTop: 4,
  },
  stationRating: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: BikeColors.onPrimary,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: BikeColors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: BikeColors.onSurface,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: BikeColors.onSurfaceVariant,
    marginTop: 2,
    textAlign: "center",
  },
  mapSection: {
    backgroundColor: BikeColors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.onSurface,
    marginBottom: 16,
  },
  mapContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  mapBackground: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: BikeColors.surfaceVariant,
    borderRadius: 12,
    position: "relative",
    borderWidth: 2,
    borderColor: BikeColors.divider,
  },
  stationLayout: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BikeColors.divider,
    borderStyle: "dashed",
  },
  bikeMarker: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bikeSlotNumber: {
    position: "absolute",
    bottom: -8,
    fontSize: 8,
    fontWeight: "bold",
    color: BikeColors.onSurface,
    backgroundColor: BikeColors.surface,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  entrance: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  legend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendItem: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
  },
  bikeListSection: {
    backgroundColor: BikeColors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bikeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: BikeColors.background,
  },
  bikeItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bikeStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bikeId: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.onSurface,
  },
  bikeType: {
    fontSize: 12,
    color: BikeColors.success,
    marginTop: 2,
  },
  bikeItemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  batteryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  batteryText: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
  },
  bikePrice: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
  },
  bikeStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  bikeRating: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
    marginTop: 2,
  },
  // Trong styles:
  rentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BikeColors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  loadMoreButton: {
    backgroundColor: BikeColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 16,
  },
  loadMoreButtonText: {
    color: BikeColors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
