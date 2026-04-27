import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform, ToastAndroid } from "react-native";

import type {
  BikeStatusUpdate,
  ReturnSlotExpiredUpdate,
} from "@/hooks/use-bike-status-stream";

import { useBikeStatusStream } from "@/hooks/use-bike-status-stream";
import {
  invalidateAllRentalQueries,
  invalidateRentalSupportQueries,
} from "@hooks/rentals/rental-cache";
import { useAuthNext } from "@providers/auth-provider-next";

type BikeStatusSubscriber = (payload: BikeStatusUpdate) => void;
type ReturnSlotSubscriber = (payload: ReturnSlotExpiredUpdate) => void;

type BikeStatusStreamContextValue = {
  isConnected: boolean;
  lastUpdate: BikeStatusUpdate | null;
  lastReturnSlotExpired: ReturnSlotExpiredUpdate | null;
  subscribe: (listener: BikeStatusSubscriber) => () => void;
  subscribeReturnSlotExpired: (listener: ReturnSlotSubscriber) => () => void;
};

const BikeStatusStreamContext = createContext<BikeStatusStreamContextValue | undefined>(undefined);

export function BikeStatusStreamProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, status } = useAuthNext();
  const queryClient = useQueryClient();
  const subscribersRef = useRef<Set<BikeStatusSubscriber>>(new Set());
  const returnSlotSubscribersRef = useRef<Set<ReturnSlotSubscriber>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<BikeStatusUpdate | null>(null);
  const [lastReturnSlotExpired, setLastReturnSlotExpired] = useState<ReturnSlotExpiredUpdate | null>(null);

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

  const notifyReturnSlotSubscribers = useCallback((payload: ReturnSlotExpiredUpdate) => {
    returnSlotSubscribersRef.current.forEach((listener) => {
      try {
        listener(payload);
      }
      catch (error) {
        console.warn("[BikeStatusStream] return slot subscriber error", error);
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

  const handleReturnSlotExpired = useCallback(
    (payload: ReturnSlotExpiredUpdate) => {
      setLastReturnSlotExpired(payload);
      void invalidateAllRentalQueries(queryClient);
      void invalidateRentalSupportQueries(queryClient);

      notifyReturnSlotSubscribers(payload);
    },
    [notifyReturnSlotSubscribers, queryClient],
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
    onReturnSlotExpired: handleReturnSlotExpired,
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

  const subscribe = useCallback((listener: BikeStatusSubscriber) => {
    subscribersRef.current.add(listener);
    return () => {
      subscribersRef.current.delete(listener);
    };
  }, []);

  const subscribeReturnSlotExpired = useCallback((listener: ReturnSlotSubscriber) => {
    returnSlotSubscribersRef.current.add(listener);
    return () => {
      returnSlotSubscribersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({
      isConnected,
      lastUpdate,
      lastReturnSlotExpired,
      subscribe,
      subscribeReturnSlotExpired,
    }),
    [isConnected, lastReturnSlotExpired, lastUpdate, subscribe, subscribeReturnSlotExpired],
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
