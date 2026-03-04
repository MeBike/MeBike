import type { MapboxRouteLine } from "@lib/mapbox-directions";

import { initMapbox } from "@lib/mapbox";
import Mapbox from "@rnmapbox/maps";
import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { StationType } from "../types/StationType";

import { StationMapMarker } from "./station-map-marker";

type StationMapProps = {
  stations: StationType[];
  onStationPress?: (station: StationType) => void;
  onMapPress?: () => void;
  route?: MapboxRouteLine | null;
  selectedStationId?: string | null;
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
  userLocationMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2563EB",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default function StationMap({
  stations,
  onStationPress,
  onMapPress,
  route,
  selectedStationId,
  userLocation,
}: StationMapProps) {
  initMapbox();
  const ignoreNextMapPressRef = useRef(false);
  const ignoreResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (ignoreResetTimerRef.current) {
        clearTimeout(ignoreResetTimerRef.current);
      }
    };
  }, []);

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
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        onPress={() => {
          if (ignoreNextMapPressRef.current) {
            ignoreNextMapPressRef.current = false;
            return;
          }
          onMapPress?.();
        }}
      >
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate,
            zoomLevel: 14,
          }}
        />

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
            <Pressable
              onPress={() => {
                ignoreNextMapPressRef.current = true;
                if (ignoreResetTimerRef.current) {
                  clearTimeout(ignoreResetTimerRef.current);
                }
                ignoreResetTimerRef.current = setTimeout(() => {
                  ignoreNextMapPressRef.current = false;
                  ignoreResetTimerRef.current = null;
                }, 250);
                onStationPress?.(station);
              }}
            >
              <StationMapMarker count={station.availableBikes} isSelected={station._id === selectedStationId} />
            </Pressable>
          </Mapbox.MarkerView>
        ))}

        {userLocation
          ? (
              <Mapbox.MarkerView
                id="user-location-marker"
                coordinate={[userLocation.longitude, userLocation.latitude]}
                allowOverlap={true}
              >
                <View style={styles.userLocationMarker} />
              </Mapbox.MarkerView>
            )
          : null}
      </Mapbox.MapView>
    </View>
  );
}
