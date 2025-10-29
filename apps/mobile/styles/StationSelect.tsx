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

import { StationCard } from "../components/StationCard";
import { LoadingScreen } from "@components/LoadingScreen";

export default function StationSelectScreen() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  // const { data: response, isLoading } = useGetAllStation();
   const [showLoading, setShowLoading] = useState(false);
  const {
    getStationByID,
    isLoadingGetStationByID,
    getAllStations,
    stations: data,
  } = useStationActions(true);
  const handleSelectStation = (stationId: string) => {
    navigation.navigate("StationDetail", { stationId });
  };
  const stations = data;
  const insets = useSafeAreaInsets();
  if (!Array.isArray(stations) || stations.length === 0) {
    return <LoadingScreen />;
  }
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
                station={stationCardData}
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
  },
  list: {
    gap: 12,
    padding: 16,
  },
});
