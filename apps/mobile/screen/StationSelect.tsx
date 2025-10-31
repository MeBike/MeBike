import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStationActions } from "@hooks/useStationAction";

import type { StationDetailScreenNavigationProp } from "../types/navigation";
import type { StationType } from "../types/StationType";

import { StationCard } from "../components/StationCard";

export default function StationSelectScreen() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();
  const { getAllStations, isLoadingGetAllStations, stations } =
    useStationActions(true);
  const [data, setData] = useState<StationType[]>([]);
  const insets = useSafeAreaInsets();
  const handleSelectStation = (stationId: string) => {
    navigation.navigate("StationDetail", { stationId });
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
      </LinearGradient>
      {isLoadingGetAllStations ? (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <ActivityIndicator size="large" color="#0066FF" />
          {/* <Text style={{ marginTop: 10 }}>Đang tải dữ liệu...</Text> */}
        </View>
      ) : (
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
              availableBikes: 0,
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
      )}
    </View>
  );
}

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
  },
  list: {
    gap: 12,
    padding: 16,
  },
});
