import { Ionicons } from "@expo/vector-icons";
import { useStationActions } from "@hooks/useStationAction";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { StationDetailScreenNavigationProp } from "../types/navigation";
import type { StationType } from "../types/StationType";

import { StationCard } from "../components/StationCard";
import StationMap from "../components/StationMap";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 1,
    flex: 1,
  },
  nearbyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  nearbyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  list: {
    gap: 12,
    padding: 16,
  },
});

export default function StationSelectScreen() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const {
    getNearbyStations,
    nearbyStations,
    isLoadingNearbyStations,
    isLoadingGetAllStations,
    stations,
  } = useStationActions(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const insets = useSafeAreaInsets();

  const handleSelectStation = (stationId: string) => {
    navigation.navigate("StationDetail", { stationId });
  };

  const handleFindNearbyStations = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      await getNearbyStations(coords.latitude, coords.longitude);
      setViewMode("map");
    }
    catch (error) {
      console.error("Error getting location:", error);
    }
  };
  // React.useEffect(() => {
  //   const fetchStations = async () => {
  //     await getAllStations();
  //     const stationsQuery = require("@hooks/query/Station/useGetAllStationQuery").useGetAllStation();
  //     const response = stationsQuery.data;
  //     if (response) {
  //       setData(response as StationType[]);
  //     }
  //   };
  //   fetchStations();
  // }, [getAllStations]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
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
        <Text style={styles.headerTitle}>Chọn trạm xe</Text>
        <TouchableOpacity
          style={styles.nearbyButton}
          onPress={handleFindNearbyStations}
        >
          <Ionicons name="location" size={20} color="#fff" />
          <Text style={styles.nearbyButtonText}>Tìm trạm gần bạn</Text>
        </TouchableOpacity>
      </LinearGradient>
      {viewMode === "map"
        ? (
            <StationMap
              stations={nearbyStations || []}
              onStationPress={station => handleSelectStation(station._id)}
              userLocation={userLocation || undefined}
            />
          )
        : (
            isLoadingGetAllStations
              ? (
                  <View style={{ alignItems: "center", marginTop: 20 }}>
                    <ActivityIndicator size="large" color="#0066FF" />
                  </View>
                )
              : (
                  <FlatList
                    data={stations}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                      <StationCard
                        station={item}
                        onPress={() => handleSelectStation(item._id)}
                      />
                    )}
                    contentContainerStyle={styles.list}
                  />
                )
          )}
    </View>
  );
}
