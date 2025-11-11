import { LoadingScreen } from "@components/LoadingScreen";
import StationMap2D from "@components/StationMap2D";
import { Ionicons } from "@expo/vector-icons";
import { useBikeActions } from "@hooks/useBikeAction";
import { useRentalsActions } from "@hooks/useRentalAction";
import { useStationActions } from "@hooks/useStationAction";
import { useAuth } from "@providers/auth-providers";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
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
function BikeDetailCard({
  bike,
  onClose,
}: {
  bike: Bike | null;
  onClose: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        margin: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
        ChipID: #
        {bike?.chip_id || bike?._id.slice(-4)}
      </Text>
      <Text>
        Trạng thái:
        <Text style={{ fontWeight: "bold" }}>{bike?.status}</Text>
      </Text>
      <Text>
        Ngày tạo:
        <Text style={{ fontWeight: "bold" }}>{bike?.created_at ? new Date(bike.created_at).toLocaleString() : "Chưa có"}</Text>
      </Text>
      <Text>
        Nhà cung cấp:
        <Text style={{ fontWeight: "bold" }}>{bike?.supplier_id || "Chưa có"}</Text>
      </Text>
      <TouchableOpacity
        style={{
          marginTop: 16,
          backgroundColor: "#0066FF",
          padding: 10,
          borderRadius: 8,
          alignItems: "center",
        }}
        onPress={onClose}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Đóng</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function StationDetailScreen() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const route = useRoute<StationDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { stationId } = route.params;
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedBikes, setLoadedBikes] = useState<Bike[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [bikeId, setBikeID] = useState<string | undefined>(undefined);
  const [selectedBike, setSelectedBike] = useState<any | null>(null);
  const [selectedDetailBike, setSelectedDetailBike] = useState<Bike | null>(null);

  const {
    getStationByID,
    responseStationDetail,
    isLoadingGetStationByID,
  } = useStationActions(true, stationId);

  const {
    allBikes,
    isFetchingAllBikes,
    getBikes,
    totalRecords,
  } = useBikeActions({
    hasToken: true,
    bike_id: bikeId,
    station_id: stationId,
    page: currentPage,
    limit,
  });

  const { postRent } = useRentalsActions(
    true,
    selectedBike?._id,
    stationId,
  );

  useEffect(() => {
    if (stationId) {
      getStationByID();
      getBikes();
    }
  }, [stationId]);

  useEffect(() => {
    if (allBikes && allBikes.length > 0) {
      if (currentPage === 1) {
        setLoadedBikes(allBikes);
      }
      else {
        setLoadedBikes(prev => [...prev, ...allBikes]);
      }
      setHasMore(allBikes.length === limit);
    }
    else if (currentPage > 1) {
      setHasMore(false);
    }
  }, [allBikes, currentPage, limit]);

  const station = responseStationDetail as StationType | null;
  const isLoading = isLoadingGetStationByID || isFetchingAllBikes;

  const validateReservationEligibility = useCallback((bike: Bike) => {
    if (bike.status !== "CÓ SẴN") {
      Alert.alert(
        "Không thể đặt trước",
        "Xe này hiện không khả dụng để đặt trước.",
      );
      return false;
    }
    if (!user?._id) {
      navigation.navigate("Login" as never);
      return false;
    }
    if (user?.verify === "UNVERIFIED") {
      Alert.alert(
        "Tài khoản chưa xác thực",
        "Vui lòng xác thực tài khoản để sử dụng tính năng đặt trước.",
      );
      return false;
    }

    return true;
  }, [navigation, user]);

  const handleReservePress = useCallback((bike: Bike) => {
    if (!validateReservationEligibility(bike)) {
      return;
    }
    const bikeLabel = bike.chip_id
      ? `Chip #${bike.chip_id}`
      : `#${bike._id.slice(-4)}`;
    navigation.navigate("ReservationFlow", {
      stationId,
      stationName: station?.name,
      stationAddress: station?.address,
      bikeId: bike._id,
      bikeName: bikeLabel,
    });
  }, [navigation, stationId, validateReservationEligibility, station]);

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


  const handleRentPress = (bike: any) => {
    console.log("Bike selected:", bike.id);
    setSelectedBike(bike);
    if (bike.status === "CÓ SẴN") {
      Alert.alert(
        "Thuê xe đạp",
        `Xe #${bike._id}\nBạn có muốn thuê xe này không?`,
        [
          {
            text: "Hủy",
            style: "cancel",
            onPress: () => setSelectedBike(null),
          },
          {
            text: "Thuê ngay",
            onPress: () => {
              console.log("Renting bike:", bike.id);
              if (user?.verify === "UNVERIFIED") {
                Alert.alert(
                  "Tài khoản chưa xác thực",
                  "Vui lòng xác thực tài khoản để thuê xe."
                );
                setSelectedBike(null);
                return;
              }
              postRent({ bike_id: bike._id });
              setSelectedBike(null);
            },
          },
          {
            text: "Đặt xe",
            onPress: () => {
              console.log("Reserving bike:", bike.id);
              if (user?.verify === "UNVERIFIED") {
                Alert.alert(
                  "Tài khoản chưa xác thực",
                  "Vui lòng xác thực tài khoản để đặt xe."
                );
                setSelectedBike(null);
                return;
              }
              handleReservePress(bike);
              setSelectedBike(null);
            },
          },
        ]
      );
    }
    else {
      Alert.alert(
        "Xe đang được sử dụng",
        `Xe #${bike._id.slice(-3)} hiện đang được thuê bởi người khác.`,
        [{ text: "OK", onPress: () => setSelectedBike(null) }],
      );
    }
  };

  const handleQuickRent = (bike: Bike) => {
    if (bike.status !== "CÓ SẴN") {
      Alert.alert(
        "Không thể thuê",
        "Xe này hiện không khả dụng."
      );
      return;
    }

    if (user?.verify === "UNVERIFIED") {
      Alert.alert(
        "Tài khoản chưa xác thực",
        "Vui lòng xác thực tài khoản để thuê xe."
      );
      return;
    }

    postRent({ bike_id: bike._id });
  };

  const handleLoadMore = () => {
    if (hasMore && !isFetchingAllBikes) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={!!selectedDetailBike}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedDetailBike(null)}
      >
        <View style={styles.modalOverlay}>
          <BikeDetailCard
            bike={selectedDetailBike}
            onClose={() => setSelectedDetailBike(null)}
          />
        </View>
      </Modal>
      <ScrollView showsVerticalScrollIndicator={false}>
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
            })}
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
            <IconSymbol name="bicycle.circle.fill" size={24} color={BikeColors.primary} />
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
          selectedBike={selectedBike}
          onBikePress={handleRentPress}
        />

        {loadedBikes && loadedBikes.length > 0 ? (
          <View style={styles.bikeListSection}>
            <Text style={styles.sectionTitle}>
              Danh sách xe (
              {loadedBikes.length}
              )
            </Text>
            {loadedBikes.map((bike: Bike, index: number) => {
              const isAvailable = bike.status === "CÓ SẴN";
              return (
                <TouchableOpacity
                  key={`${bike._id}-${index}`}
                  style={[
                    styles.bikeItem,
                    selectedBike?._id === bike._id && styles.selectedBikeItem,
                  ]}
                  onPress={() => setSelectedDetailBike(bike)}
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
                        ChipID: #
                        {bike.chip_id || bike._id.slice(-4)}
                      </Text>
                      <Text style={styles.bikeType}>Xe thường</Text>
                    </View>
                  </View>

                  {/* Phải: Các nút thao tác */}
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

                    {isAvailable && (
                      <TouchableOpacity
                        style={styles.reserveButton}
                        onPress={() => handleReservePress(bike)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#fff"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.reserveButtonText}>
                          Đặt xe
                        </Text>
                      </TouchableOpacity>
                    )}

                    {isAvailable && (
                      <TouchableOpacity
                        style={[
                          styles.reserveButton,
                          {
                            backgroundColor: BikeColors.success,
                            marginLeft: 8,
                          },
                        ]}
                        onPress={() => handleQuickRent(bike)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="bicycle-outline"
                          size={16}
                          color="#fff"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.reserveButtonText}>Thuê ngay</Text>
                      </TouchableOpacity>
                    )}
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
                {isFetchingAllBikes
                  ? (
                      <ActivityIndicator size="small" color="#fff" />
                    )
                  : (
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
  selectedBikeItem: {
    backgroundColor: BikeColors.primaryContainer,
    borderWidth: 2,
    borderColor: BikeColors.primary,
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
  reserveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BikeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-end",
  },
  reserveButtonText: {
    color: BikeColors.onPrimary,
    fontWeight: "600",
    fontSize: 13,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
