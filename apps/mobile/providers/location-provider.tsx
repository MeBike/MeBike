import { log } from "@lib/log";
import * as Location from "expo-location";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

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
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const latestLocationRef = useRef<Coordinates | null>(null);

  const clearWatchSubscription = useCallback(() => {
    if (!watchSubscriptionRef.current) {
      return;
    }

    log.debug("Location watch stopped");
    watchSubscriptionRef.current.remove();
    watchSubscriptionRef.current = null;
  }, []);

  const applyLocation = useCallback((nextLocation: Coordinates, source: string) => {
    latestLocationRef.current = nextLocation;
    log.debug("Location fix applied", {
      latitude: nextLocation.latitude,
      longitude: nextLocation.longitude,
      source,
    });
    setLocation(nextLocation);
    setStatus("ready");
    setError(null);
  }, []);

  const ensureWatchSubscription = useCallback(async () => {
    if (watchSubscriptionRef.current) {
      return;
    }

    log.debug("Location watch starting");
    watchSubscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
        mayShowUserSettingsDialog: false,
        timeInterval: 10000,
      },
      (nextLocation) => {
        log.debug("Location watch update", {
          accuracy: nextLocation.coords.accuracy,
          latitude: nextLocation.coords.latitude,
          longitude: nextLocation.coords.longitude,
          mocked: nextLocation.mocked,
          timestamp: nextLocation.timestamp,
        });
        applyLocation({
          latitude: nextLocation.coords.latitude,
          longitude: nextLocation.coords.longitude,
        }, "watch");
      },
    );
    log.debug("Location watch started");
  }, [applyLocation]);

  const refresh = useCallback(async () => {
    if (inflightRefreshRef.current) {
      log.debug("Location refresh reused inflight request");
      return inflightRefreshRef.current;
    }

    const task = (async () => {
      log.debug("Location refresh started");
      if (!latestLocationRef.current) {
        setStatus("loading");
      }
      setError(null);
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        log.debug("Location services enabled check", { servicesEnabled });
        if (!servicesEnabled) {
          clearWatchSubscription();
          latestLocationRef.current = null;
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
          : currentPermission.canAskAgain
            ? await Location.requestForegroundPermissionsAsync()
            : currentPermission;

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
          clearWatchSubscription();
          latestLocationRef.current = null;
          setLocation(null);
          setStatus("denied");
          setError("Permission denied");
          return;
        }

        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: 5 * 60 * 1000,
          requiredAccuracy: 1000,
        });

        const isRecentLastKnown = lastKnown
          ? Date.now() - lastKnown.timestamp <= 5 * 60 * 1000
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
          applyLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          }, "last-known");
        }

        await ensureWatchSubscription();

        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: false,
          });
          log.debug("Location current position success", {
            accuracy: currentLocation.coords.accuracy,
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            mocked: currentLocation.mocked,
            timestamp: currentLocation.timestamp,
          });
          applyLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }, "current");
        }
        catch (currentPositionError) {
          log.warn("Location current position failed", currentPositionError);
          if (latestLocationRef.current) {
            log.debug("Location refresh keeping last known provider fix", latestLocationRef.current);
            setStatus("ready");
            return;
          }

          throw new Error("Current location is unavailable");
        }
      }
      catch (err) {
        log.error("Location refresh failed", err);
        if (latestLocationRef.current) {
          setStatus("ready");
          setError("Using the last known location");
          return;
        }

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
  }, [applyLocation, clearWatchSubscription, ensureWatchSubscription]);

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

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState !== "active") {
        return;
      }

      log.debug("Location provider foreground refresh requested");
      void refresh();
    });

    return () => {
      subscription.remove();
      clearWatchSubscription();
    };
  }, [clearWatchSubscription, refresh]);

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
