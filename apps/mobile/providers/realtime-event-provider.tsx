import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, ToastAndroid } from "react-native";

import type {
  BikeStatusUpdate,
  NfcCardSwipeFailedUpdate,
  ReturnSlotExpiredUpdate,
} from "@/types/realtime-events";

import { useRealtimeEventStream } from "@/hooks/use-realtime-event-stream";
import {
  invalidateAllRentalQueries,
  invalidateRentalSupportQueries,
} from "@hooks/rentals/rental-cache";
import { useAuthNext } from "@providers/auth-provider-next";

type BikeStatusSubscriber = (payload: BikeStatusUpdate) => void;
type ReturnSlotSubscriber = (payload: ReturnSlotExpiredUpdate) => void;

const NFC_CARD_ALERT_DEDUPE_MS = 10_000;

const nfcCardSwipeFailedMessages: Record<NfcCardSwipeFailedUpdate["reason"], { title: string; message: string }> = {
  ACTIVE_RENTAL_EXISTS: {
    title: "Bạn đang có chuyến thuê",
    message: "Vui lòng kết thúc chuyến thuê hiện tại trước khi mở khóa xe khác.",
  },
  ACTIVE_RESERVATION_EXISTS: {
    title: "Bạn đang có đặt xe",
    message: "Vui lòng kiểm tra đơn đặt xe hiện tại trước khi mở khóa xe khác.",
  },
  BIKE_RESERVED: {
    title: "Xe đã được đặt trước",
    message: "Xe này đang được giữ cho người khác. Vui lòng chọn xe khác.",
  },
  INSUFFICIENT_FUNDS: {
    title: "Số dư không đủ",
    message: "Vui lòng nạp thêm tiền vào ví để tiếp tục thuê xe.",
  },
  OVERNIGHT_OPERATIONS_CLOSED: {
    title: "Ngoài giờ phục vụ",
    message: "Hiện ngoài giờ phục vụ. Vui lòng thử lại trong khung giờ hoạt động.",
  },
};

type RealtimeEventContextValue = {
  isConnected: boolean;
  lastBikeStatusUpdate: BikeStatusUpdate | null;
  lastReturnSlotExpired: ReturnSlotExpiredUpdate | null;
  lastNfcCardSwipeFailed: NfcCardSwipeFailedUpdate | null;
  subscribeBikeStatus: (listener: BikeStatusSubscriber) => () => void;
  subscribeReturnSlotExpired: (listener: ReturnSlotSubscriber) => () => void;
};

const RealtimeEventContext = createContext<RealtimeEventContextValue | undefined>(undefined);

export function RealtimeEventProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, status } = useAuthNext();
  const queryClient = useQueryClient();
  const subscribersRef = useRef<Set<BikeStatusSubscriber>>(new Set());
  const returnSlotSubscribersRef = useRef<Set<ReturnSlotSubscriber>>(new Set());
  const nfcCardAlertDedupeRef = useRef<Map<string, number>>(new Map());
  const [lastBikeStatusUpdate, setLastBikeStatusUpdate] = useState<BikeStatusUpdate | null>(null);
  const [lastReturnSlotExpired, setLastReturnSlotExpired] = useState<ReturnSlotExpiredUpdate | null>(null);
  const [lastNfcCardSwipeFailed, setLastNfcCardSwipeFailed] = useState<NfcCardSwipeFailedUpdate | null>(null);

  const notifySubscribers = useCallback((payload: BikeStatusUpdate) => {
    subscribersRef.current.forEach((listener) => {
      try {
        listener(payload);
      }
      catch (error) {
        console.warn("[RealtimeEvent] bike status subscriber error", error);
      }
    });
  }, []);

  const notifyReturnSlotSubscribers = useCallback((payload: ReturnSlotExpiredUpdate) => {
    returnSlotSubscribersRef.current.forEach((listener) => {
      try {
        listener(payload);
      }
      catch (error) {
        console.warn("[RealtimeEvent] return slot subscriber error", error);
      }
    });
  }, []);

  const handleUpdate = useCallback(
    (payload: BikeStatusUpdate) => {
      setLastBikeStatusUpdate(payload);
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

  const handleNfcCardSwipeFailed = useCallback((payload: NfcCardSwipeFailedUpdate) => {
    setLastNfcCardSwipeFailed(payload);
    const now = Date.now();
    const dedupeKey = `${payload.reason}:${payload.bikeId}`;
    const lastShownAt = nfcCardAlertDedupeRef.current.get(dedupeKey) ?? 0;

    for (const [key, shownAt] of nfcCardAlertDedupeRef.current) {
      if (now - shownAt > NFC_CARD_ALERT_DEDUPE_MS) {
        nfcCardAlertDedupeRef.current.delete(key);
      }
    }

    if (now - lastShownAt < NFC_CARD_ALERT_DEDUPE_MS) {
      return;
    }

    nfcCardAlertDedupeRef.current.set(dedupeKey, now);
    const content = nfcCardSwipeFailedMessages[payload.reason];
    Alert.alert(content.title, content.message);
  }, []);

  const handleError = useCallback((error: Error) => {
    if (error.message === "SSE_UNAUTHORIZED") {
      void hydrate();
    }

    console.warn("[RealtimeEvent] SSE error", error);
  }, [hydrate]);

  const { isConnected, connect, disconnect } = useRealtimeEventStream({
    autoConnect: false,
    onUpdate: handleUpdate,
    onReturnSlotExpired: handleReturnSlotExpired,
    onNfcCardSwipeFailed: handleNfcCardSwipeFailed,
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

  const subscribeBikeStatus = useCallback((listener: BikeStatusSubscriber) => {
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
      lastBikeStatusUpdate,
      lastReturnSlotExpired,
      lastNfcCardSwipeFailed,
      subscribeBikeStatus,
      subscribeReturnSlotExpired,
    }),
    [isConnected, lastBikeStatusUpdate, lastNfcCardSwipeFailed, lastReturnSlotExpired, subscribeBikeStatus, subscribeReturnSlotExpired],
  );

  return <RealtimeEventContext.Provider value={value}>{children}</RealtimeEventContext.Provider>;
}

export function useRealtimeEventContext() {
  const ctx = useContext(RealtimeEventContext);
  if (!ctx) {
    throw new Error("useRealtimeEventContext must be used within RealtimeEventProvider");
  }
  return ctx;
}
