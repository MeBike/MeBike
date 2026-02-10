import type { MapboxRouteLine } from "@lib/mapbox-directions";

import { initMapbox } from "@lib/mapbox";
import Mapbox from "@rnmapbox/maps";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { StationType } from "../types/StationType";

import { StationMapMarker } from "./station-map-marker";

type StationMapProps = {
  stations: StationType[];
  onStationPress?: (station: StationType) => void;
  route?: MapboxRouteLine | null;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
};

const routeLineStyle = {
  lineColor: "#2563EB",
  lineWidth: 4,
  lineCap: "round",
  lineJoin: "round",
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    flex: 1,
  },
});

export default function StationMap({
  stations,
  onStationPress,
  route,
  userLocation,
}: StationMapProps) {
  initMapbox();

  const centerCoordinate = useMemo<[number, number]>(() => {
    if (userLocation)
      return [userLocation.longitude, userLocation.latitude];
    const first = stations[0];
    if (first)
      return [Number.parseFloat(first.longitude), Number.parseFloat(first.latitude)];
    return [106.660172, 10.762622];
  }, [stations, userLocation]);

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Street}>
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate,
            zoomLevel: 14,
          }}
        />

        <Mapbox.UserLocation visible={true} />

        {route
          ? (
              <Mapbox.ShapeSource id="route-source" shape={route}>
                <Mapbox.LineLayer id="route-line" style={routeLineStyle} />
              </Mapbox.ShapeSource>
            )
          : null}

        {stations.map(station => (
          <Mapbox.MarkerView
            key={station._id}
            id={station._id}
            coordinate={[
              Number.parseFloat(station.longitude),
              Number.parseFloat(station.latitude),
            ]}
          >
            <Pressable onPress={() => onStationPress?.(station)}>
              <StationMapMarker count={station.availableBikes} />
            </Pressable>
          </Mapbox.MarkerView>
        ))}
      </Mapbox.MapView>
    </View>
  );
}
