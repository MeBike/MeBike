import { log } from "@lib/log";
import * as Location from "expo-location";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationStatus = "idle" | "loading" | "ready" | "denied" | "error";

type LocationContextValue = {
  location: Coordinates | null;
  status: LocationStatus;
  error: string | null;
  refresh: () => Promise<void>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const inflightRefreshRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (inflightRefreshRef.current) {
      return inflightRefreshRef.current;
    }

    const task = (async () => {
      setStatus("loading");
      setError(null);
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          setStatus("error");
          setError("Location services are disabled");
          return;
        }

        const currentPermission = await Location.getForegroundPermissionsAsync();
        const permission = currentPermission.status === "granted"
          ? currentPermission
          : await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          setStatus("denied");
          setError("Permission denied");
          return;
        }

        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: true,
          });
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
          setStatus("ready");
        }
        catch {
          const lastKnown = await Location.getLastKnownPositionAsync({
            maxAge: 10 * 60 * 1000,
            requiredAccuracy: 500,
          });

          if (lastKnown) {
            setLocation({
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
            });
            setStatus("ready");
            return;
          }

          throw new Error("Current location is unavailable");
        }
      }
      catch (err) {
        log.error("Location refresh failed", err);
        setStatus("error");
        setError("Failed to get location");
      }
      finally {
        inflightRefreshRef.current = null;
      }
    })();

    inflightRefreshRef.current = task;
    return task;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      location,
      status,
      error,
      refresh,
    }),
    [location, status, error, refresh],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useCurrentLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useCurrentLocation must be used within LocationProvider");
  }
  return ctx;
}
