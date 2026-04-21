import Mapbox from "@rnmapbox/maps";
import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, View } from "react-native";

import type { StationReadSummary } from "@/contracts/server";
import type { MapboxRouteLine } from "@lib/mapbox-directions";

import { initMapbox } from "@lib/mapbox";

import { StationMapMarker } from "./station-map-marker";

type StationMapProps = {
  stations: StationReadSummary[];
  onStationPress?: (station: StationReadSummary) => void;
  onMapPress?: () => void;
  recenterToUserLocationKey?: number;
  route?: MapboxRouteLine | null;
  selectedStationId?: string | null;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
};

export default function StationMap({
  stations,
  onStationPress,
  onMapPress,
  recenterToUserLocationKey = 0,
  route,
  selectedStationId,
  userLocation,
}: StationMapProps) {
  initMapbox();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const ignoreNextMapPressRef = useRef(false);
  const ignoreResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoCenteredUserLocationRef = useRef(false);
  const latestUserLocationRef = useRef(userLocation);

  useEffect(() => {
    latestUserLocationRef.current = userLocation;
  }, [userLocation]);

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
      return [first.location.longitude, first.location.latitude];
    return [106.660172, 10.762622];
  }, [stations, userLocation]);

  useEffect(() => {
    if (!userLocation) {
      hasAutoCenteredUserLocationRef.current = false;
      return;
    }

    if (hasAutoCenteredUserLocationRef.current) {
      return;
    }

    hasAutoCenteredUserLocationRef.current = true;
    cameraRef.current?.setCamera({
      centerCoordinate: [userLocation.longitude, userLocation.latitude],
      zoomLevel: 14,
      animationDuration: 700,
    });
  }, [userLocation]);

  useEffect(() => {
    if (recenterToUserLocationKey === 0) {
      return;
    }

    const nextUserLocation = latestUserLocationRef.current;
    if (!nextUserLocation) {
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: [nextUserLocation.longitude, nextUserLocation.latitude],
      zoomLevel: 15,
      animationDuration: 700,
    });
  }, [recenterToUserLocationKey]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Mapbox.MapView
        style={{ flex: 1 }}
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
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate,
            zoomLevel: 14,
          }}
        />

        {route
          ? (
              <Mapbox.ShapeSource id="route-source" shape={route}>
                <Mapbox.LineLayer
                  id="route-line"
                  style={{
                    lineColor: "#2563EB",
                    lineWidth: 4,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              </Mapbox.ShapeSource>
            )
          : null}

        {stations.map(station => (
          <Mapbox.MarkerView
            key={station.id}
            id={station.id}
            coordinate={[station.location.longitude, station.location.latitude]}
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
              <StationMapMarker count={station.bikes.available} isSelected={station.id === selectedStationId} />
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
                <View
                  style={{
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
                  }}
                />
              </Mapbox.MarkerView>
            )
          : null}
      </Mapbox.MapView>
    </View>
  );
}
