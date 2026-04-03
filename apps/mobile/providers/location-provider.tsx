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
      log.debug("Location refresh reused inflight request");
      return inflightRefreshRef.current;
    }

    const task = (async () => {
      log.debug("Location refresh started");
      setStatus("loading");
      setError(null);
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        log.debug("Location services enabled check", { servicesEnabled });
        if (!servicesEnabled) {
          setLocation(null);
          setStatus("error");
          setError("Location services are disabled");
          return;
        }

        const currentPermission = await Location.getForegroundPermissionsAsync();
        log.debug("Location foreground permission", {
          canAskAgain: currentPermission.canAskAgain,
          granted: currentPermission.granted,
          status: currentPermission.status,
        });
        const providerStatus = await Location.getProviderStatusAsync();
        log.debug("Location provider status", providerStatus);
        const permission = currentPermission.status === "granted"
          ? currentPermission
          : await Location.requestForegroundPermissionsAsync();

        if (currentPermission.status !== "granted") {
          log.debug("Location permission request result", {
            canAskAgain: permission.canAskAgain,
            granted: permission.granted,
            status: permission.status,
          });
        }

        if (permission.status !== "granted") {
          log.warn("Location permission denied", {
            canAskAgain: permission.canAskAgain,
            status: permission.status,
          });
          setLocation(null);
          setStatus("denied");
          setError("Permission denied");
          return;
        }

        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            mayShowUserSettingsDialog: false,
          });
          log.debug("Location current position success", {
            accuracy: currentLocation.coords.accuracy,
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            mocked: currentLocation.mocked,
            timestamp: currentLocation.timestamp,
          });
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
          setStatus("ready");
        }
        catch (currentPositionError) {
          log.warn("Location current position failed", currentPositionError);
          const lastKnown = await Location.getLastKnownPositionAsync({
            maxAge: 2 * 60 * 1000,
            requiredAccuracy: 500,
          });

          const isRecentLastKnown = lastKnown
            ? Date.now() - lastKnown.timestamp <= 2 * 60 * 1000
            : false;

          log.debug("Location last known lookup", {
            accuracy: lastKnown?.coords.accuracy,
            ageMs: lastKnown ? Date.now() - lastKnown.timestamp : null,
            found: Boolean(lastKnown),
            isRecentLastKnown,
            latitude: lastKnown?.coords.latitude,
            longitude: lastKnown?.coords.longitude,
            mocked: lastKnown?.mocked,
            timestamp: lastKnown?.timestamp,
          });

          if (lastKnown && isRecentLastKnown) {
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
        setLocation(null);
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
    log.debug("Location provider state changed", {
      error,
      location,
      status,
    });
  }, [error, location, status]);

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
