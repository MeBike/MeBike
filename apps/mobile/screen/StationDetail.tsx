import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
  StationDetailScreenNavigationProp,
  StationDetailRouteProp,
} from "../types/navigation";
import { IconSymbol } from "../components/IconSymbol";
import { BikeColors } from "../constants/BikeColors";
import { useBikeActions } from "@hooks/useBikeAction";
import { useStationActions } from "@hooks/useStationAction";
import { ActivityIndicator } from "react-native";
import StationMap2D from "@components/StationMap2D";
import { StationType } from "../types/StationType";
import { Bike } from "../types/BikeTypes";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRentalsActions } from "@hooks/useRentalAction";
import { useAuth } from "@providers/auth-providers";
const { width: screenWidth } = Dimensions.get("window");
const MAP_PADDING = 20;
const MAP_WIDTH = screenWidth - MAP_PADDING * 2;
const MAP_HEIGHT = 300;

export default function StationDetailScreen() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const route = useRoute<StationDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { stationId } = route.params;
  console.log("Giá trị stationId TRUYỀN VÀO:", stationId);
  const [selectedBike, setSelectedBike] = useState<any | null>(null);
  useEffect(() => {
    getStationByID();
    console.log("StationDetail stationId:", stationId);
  }, []);
  const {
    getStationByID,
    responseStationDetail,
    fetchingStationID,
    isLoadingGetStationByID,
  } = useStationActions(true, stationId);
  const { allBikes, isFetchingAllBikes, getBikes } = useBikeActions({
    hasToken: true,
    station_id: stationId,
  });
  const { postRent, isPostRentLoading } = useRentalsActions(true , selectedBike?._id);
  useEffect(() => {
    if (stationId) {
      getStationByID();
      getBikes();
    }
  }, [stationId]);
  useEffect(() => {
    console.log("Station Detail Bikes:", allBikes);
  }, [allBikes]);
  let station = responseStationDetail as StationType | null;

  const isLoading = isLoadingGetStationByID && isFetchingAllBikes;

  if (isLoading) {
    return (
      <View
        style={[
          styles.errorContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={BikeColors.primary} />
      </View>
    );
  }

  if (!station) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy trạm</Text>
      </View>
    );
  }

  const handleBikePress = (bike: any) => {
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
              if(user?.verify === "UNVERIFIED"){
                Alert.alert(
                  "Tài khoản chưa xác thực",
                  "Vui lòng xác thực tài khoản để thuê xe.",
                );
                setSelectedBike(null);
                return;
              }
              postRent({ bike_id: bike._id });
              setSelectedBike(null);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Xe đang được sử dụng",
      `Xe #${bike._id.slice(-3)} hiện đang được thuê bởi người khác.`,
        [{ text: "OK", onPress: () => setSelectedBike(null) }]
      );
    }
  };

  const renderBikeOnMap = (bike: any) => {
    if (!bike.positionInStation) return null;

    const x = (bike.positionInStation.x / 100) * MAP_WIDTH;
    const y = (bike.positionInStation.y / 100) * MAP_HEIGHT;

    const getBikeColor = () => {
      if (!bike.isAvailable) return BikeColors.error;
      if (bike.type === "electric") {
        if (bike.batteryLevel > 60) return BikeColors.success;
        if (bike.batteryLevel > 30) return BikeColors.warning;
        return BikeColors.error;
      }
      return BikeColors.primary;
    };

    const isSelected = selectedBike?.id === bike.id;

    return (
      <Pressable
        key={bike.id}
        style={[
          styles.bikeMarker,
          {
            left: x - 15,
            top: y - 15,
            backgroundColor: getBikeColor(),
            borderColor: isSelected ? BikeColors.accent : "transparent",
            borderWidth: isSelected ? 3 : 0,
          },
        ]}
        onPress={() => handleBikePress(bike)}
      >
        <IconSymbol name="bicycle" size={16} color={BikeColors.onPrimary} />
        <Text style={styles.bikeSlotNumber}>
          {bike.positionInStation.slotNumber}
        </Text>
      </Pressable>
    );
  };

  const renderEntrance = (entrance: any, index: number) => {
    const x = (entrance.x / 100) * MAP_WIDTH;
    const y = (entrance.y / 100) * MAP_HEIGHT;

    return (
      <View
        key={index}
        style={[
          styles.entrance,
          {
            left: x - 10,
            top: y - 10,
            backgroundColor:
              entrance.type === "main" ? BikeColors.accent : BikeColors.primary,
          },
        ]}
      >
        <IconSymbol
          name={
            entrance.type === "main"
              ? "door.left.hand.open"
              : "door.right.hand.open"
          }
          size={12}
          color={BikeColors.onPrimary}
        />
      </View>
    );
  };
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <IconSymbol name="bolt.fill" size={24} color={BikeColors.primary} />
          <Text style={styles.statNumber}>{station.totalBikes}</Text>
          <Text style={styles.statLabel}>Tổng số Xe</Text>
        </View>
        <View style={styles.statCard}>
          <IconSymbol
            name="bicycle.circle"
            size={24}
            color={BikeColors.primary}
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
        onBikePress={handleBikePress}
      />

      {allBikes && allBikes.length > 0 ? (
        <View style={styles.bikeListSection}>
          <Text style={styles.sectionTitle}>
            Danh sách xe ({allBikes.length})
          </Text>
          {allBikes.map((bike: Bike) => {
            const isAvailable = bike.status === "CÓ SẴN";
            return (
              <Pressable
                key={bike._id}
                style={[
                  styles.bikeItem,
                  selectedBike?._id === bike._id && styles.selectedBikeItem,
                ]}
                onPress={() => handleBikePress(bike)}
              >
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
                  </View>
                </View>

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
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Xe đang được thuê hết</Text>
        </View>
      )}
    </ScrollView>
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
    gap: 4,
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
});
