import {
  invalidateAllRentalQueries,
  invalidateRentalSupportQueries,
} from "@hooks/rentals/rental-cache";
import { useAuthNext } from "@providers/auth-provider-next";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform, ToastAndroid } from "react-native";

import type { BikeStatusUpdate } from "@/hooks/use-bike-status-stream";

import { useBikeStatusStream } from "@/hooks/use-bike-status-stream";

type Subscriber = (payload: BikeStatusUpdate) => void;

type BikeStatusStreamContextValue = {
  isConnected: boolean;
  lastUpdate: BikeStatusUpdate | null;
  subscribe: (listener: Subscriber) => () => void;
};

const BikeStatusStreamContext = createContext<BikeStatusStreamContextValue | undefined>(undefined);

export function BikeStatusStreamProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, status } = useAuthNext();
  const queryClient = useQueryClient();
  const subscribersRef = useRef<Set<Subscriber>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<BikeStatusUpdate | null>(null);

  const notifySubscribers = useCallback((payload: BikeStatusUpdate) => {
    subscribersRef.current.forEach((listener) => {
      try {
        listener(payload);
      }
      catch (error) {
        console.warn("[BikeStatusStream] subscriber error", error);
      }
    });
  }, []);

  const handleUpdate = useCallback(
    (payload: BikeStatusUpdate) => {
      setLastUpdate(payload);
      void invalidateAllRentalQueries(queryClient);
      void invalidateRentalSupportQueries(queryClient);

      if (Platform.OS === "android") {
        const status = (payload.status || "").toUpperCase();
        let message = "Trạng thái xe đã được cập nhật";

        if (status.includes("ĐANG ĐƯỢC THUÊ")) {
          message = "Thuê xe thành công";
        }
        else if (status.includes("CÓ SẴN")) {
          message = "Kết thúc phiên thuê xe thành công";
        }

        ToastAndroid.show(message, ToastAndroid.SHORT);
      }

      notifySubscribers(payload);
    },
    [notifySubscribers, queryClient],
  );

  const handleError = useCallback((error: Error) => {
    if (error.message === "SSE_UNAUTHORIZED") {
      void hydrate();
    }

    console.warn("[BikeStatusStream] SSE error", error);
  }, [hydrate]);

  const { isConnected, connect, disconnect } = useBikeStatusStream({
    autoConnect: false,
    onUpdate: handleUpdate,
    onError: handleError,
  });

  useEffect(() => {
    if (status !== "authenticated") {
      disconnect();
    }

    if (status === "authenticated") {
      connect();
    }
  }, [connect, disconnect, status]);

  const subscribe = useCallback((listener: Subscriber) => {
    subscribersRef.current.add(listener);
    return () => {
      subscribersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({
      isConnected,
      lastUpdate,
      subscribe,
    }),
    [isConnected, lastUpdate, subscribe],
  );

  return <BikeStatusStreamContext.Provider value={value}>{children}</BikeStatusStreamContext.Provider>;
}

export function useBikeStatusStreamContext() {
  const ctx = useContext(BikeStatusStreamContext);
  if (!ctx) {
    throw new Error("useBikeStatusStreamContext must be used within BikeStatusStreamProvider");
  }
  return ctx;
}
