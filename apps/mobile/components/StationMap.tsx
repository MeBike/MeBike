import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import type { Station } from "../types/StationType";

const { width, height } = Dimensions.get("window");

type StationMapProps = {
  stations: Station[];
  onStationPress?: (station: Station) => void;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
};

export default function StationMap({ stations, onStationPress, userLocation }: StationMapProps) {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState(userLocation);

  const getCurrentLocation = async () => {
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
      setCurrentLocation(coords);
    }
    catch (error) {
      console.error("Error getting location:", error);
    }
  };

  useEffect(() => {
    if (!userLocation) {
      getCurrentLocation();
    }
  }, [userLocation]);

  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 10.762622,
        longitude: 106.660172,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {stations.map((station) => {
          return (
            <Marker
              key={station._id}
              coordinate={{
                latitude: Number.parseFloat(station.latitude),
                longitude: Number.parseFloat(station.longitude),
              }}
              title={station.name}
              description={`${station.address} - ${station.availableBikes} xe có sẵn`}
              onPress={() => onStationPress?.(station)}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Text style={styles.markerText}>{station.availableBikes}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    width,
    height: height * 0.6,
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    backgroundColor: "#0066FF",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
