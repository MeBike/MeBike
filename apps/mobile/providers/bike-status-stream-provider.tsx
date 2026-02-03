import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform, ToastAndroid } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useBikeStatusStream, type BikeStatusUpdate } from "@hooks/useBikeStatusStream";
import { useAuthNext } from "@providers/auth-provider-next";

type Subscriber = (payload: BikeStatusUpdate) => void;

type BikeStatusStreamContextValue = {
  isConnected: boolean;
  lastUpdate: BikeStatusUpdate | null;
  subscribe: (listener: Subscriber) => () => void;
};

const BikeStatusStreamContext = createContext<BikeStatusStreamContextValue | undefined>(undefined);

export function BikeStatusStreamProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthNext();
  const queryClient = useQueryClient();
  const subscribersRef = useRef<Set<Subscriber>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<BikeStatusUpdate | null>(null);

  const notifySubscribers = useCallback((payload: BikeStatusUpdate) => {
    subscribersRef.current.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.warn("[BikeStatusStream] subscriber error", error);
      }
    });
  }, []);

  const handleUpdate = useCallback(
    (payload: BikeStatusUpdate) => {
      setLastUpdate(payload);
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      queryClient.invalidateQueries({ queryKey: ["rentals", "all"] });
      queryClient.invalidateQueries({ queryKey: ["rentalsHistory"] });
      queryClient.invalidateQueries({ queryKey: ["bikes", "all"] });
      queryClient.invalidateQueries({ queryKey: ["all-stations"] });
      queryClient.invalidateQueries({ queryKey: ["station"] });

      if (Platform.OS === "android") {
        const status = (payload.status || "").toUpperCase();
        let message = "Trạng thái xe đã được cập nhật";

        if (status.includes("ĐANG ĐƯỢC THUÊ")) {
          message = "Thuê xe thành công";
        } else if (status.includes("CÓ SẴN")) {
          message = "Kết thúc phiên thuê xe thành công";
        }

        ToastAndroid.show(message, ToastAndroid.SHORT);
      }

      notifySubscribers(payload);
    },
    [notifySubscribers, queryClient]
  );

  const handleError = useCallback((error: Error) => {
    console.warn("[BikeStatusStream] SSE error", error);
  }, []);

  const { isConnected, connect, disconnect } = useBikeStatusStream({
    autoConnect: false,
    onUpdate: handleUpdate,
    onError: handleError,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      disconnect();
    } else {
      connect();
    }
  }, [connect, disconnect, isAuthenticated]);

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
    [isConnected, lastUpdate, subscribe]
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
