import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStationActions } from "@hooks/useStationAction";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { StationDetailScreenNavigationProp } from "../types/navigation";
import { Ionicons } from "@expo/vector-icons";

import { StationCard } from "../components/StationCard";
import { LoadingScreen } from "@components/LoadingScreen";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
} from "expo-location";

export default function StationSelectScreen() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const [showLoading, setShowLoading] = useState(false);
  const [showingNearby, setShowingNearby] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const getCurrentLocation = async () => {
    try {
      let { status } = await requestForegroundPermissionsAsync();
      console.log("Permission status:", status);
      
      if (status !== "granted") {
        console.log("Permission denied");
        return;
      }
      
      let location = await getCurrentPositionAsync({
        accuracy: 5,
      });
      console.log("Location obtained:", location);
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (e) {
      console.error("Location error:", e);
    }
  };

  // gọi lấy vị trí khi vào màn
  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  React.useEffect(() => {
    if (showingNearby && currentLocation) {
      getNearbyStations();
    }
  }, [showingNearby, currentLocation]);
  
  
  const {
    getStationByID,
    isLoadingGetStationByID,
    getAllStations,
    stations: data,
    getNearbyStations,
    nearbyStations,
    isLoadingNearbyStations,
  } = useStationActions(true, undefined, currentLocation?.latitude, currentLocation?.longitude);
  const handleSelectStation = (stationId: string) => {
    navigation.navigate("StationDetail", { stationId });
  };

  const handleFindNearbyStations = async () => {
    if (!currentLocation) {
      console.log("Location not available");
      return;
    }
    setShowingNearby(!showingNearby);
  };

  const handleToggleMap = () => {
    setShowMap(!showMap);
  };

  const handleStationPress = (stationId: string) => {
    navigation.navigate("StationDetail", { stationId });
  };

  const stations = showingNearby ? nearbyStations : data;
  const insets = useSafeAreaInsets();
  if (
    !Array.isArray(stations) ||
    stations === null ||
    stations.length === 0 ||
    showLoading
  ) {
    return <LoadingScreen />;
  }
  // if(stations.length === 0){
  //   return (
  //     <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
  //       <Text>Không có trạm nào khả dụng</Text>
  //     </View>
  //   )
  // }
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Chi tiết thuê xe</Text>
        <Text style={styles.headerSubtitle}>
          Xem tất cả các lần thuê xe của bạn
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.findNearbyButton}
            onPress={handleFindNearbyStations}
            disabled={isLoadingNearbyStations}
          >
            {isLoadingNearbyStations ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.findNearbyButtonText}>
                  {showingNearby ? "Tất cả trạm" : "Tìm trạm gần bạn"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
        </View>
      </LinearGradient>
        <FlatList
          data={stations}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const stationCardData = {
              id: item._id,
              name: item.name,
              location: {
                latitude: Number(item.latitude),
                longitude: Number(item.longitude),
                address: item.address,
              },
              availableBikes: Number(item.availableBikes),
              totalSlots: Number(item.capacity),
              isActive: true,
              bikes: [],
              layout: { width: 0, height: 0, entrances: [] },
            };
            return (
              <StationCard
                station={item}
                onPress={() => handleSelectStation(item._id)}
                
              />
            );
          }}
          contentContainerStyle={styles.list}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 0,
  },
  backButton: {
    paddingTop: 5,
    marginRight: 16,
    padding: 5,
  },
  header: {
    width: "100%",
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
  },
  findNearbyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  findNearbyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  list: {
    gap: 12,
    padding: 16,
  },
});
