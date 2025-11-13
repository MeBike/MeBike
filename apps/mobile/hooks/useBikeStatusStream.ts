import { useCallback, useEffect, useRef, useState } from "react";
import EventSource from "react-native-sse";
import type { ErrorEvent, TimeoutEvent, ExceptionEvent } from "react-native-sse";

import { API_BASE_URL } from "@lib/httpClient";
import { getAccessToken } from "@utils/tokenManager";

export type BikeStatusUpdate = {
  bikeId: string;
  status: string;
};

type CustomEventName = "bikeStatusUpdate";

export type UseBikeStatusStreamOptions = {
  autoConnect?: boolean;
  onUpdate?: (payload: BikeStatusUpdate) => void;
  onError?: (error: Error) => void;
};

export function useBikeStatusStream(options?: UseBikeStatusStreamOptions) {
  const { autoConnect = true, onUpdate, onError } = options ?? {};
  const [lastUpdate, setLastUpdate] = useState<BikeStatusUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource<CustomEventName> | null>(null);
  const onUpdateRef = useRef<typeof onUpdate>(onUpdate);
  const onErrorRef = useRef<typeof onError>(onError);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      disconnect();
      const token = await getAccessToken();
      const eventSource = new EventSource<CustomEventName>(`${API_BASE_URL}/events`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: false,
        timeoutBeforeConnection: 5000,
        pollingInterval: 5000,
      });

      eventSource.addEventListener("open", () => {
        setIsConnected(true);
      });

      eventSource.addEventListener("bikeStatusUpdate", (event) => {
        try {
          const payload = event.data ? (JSON.parse(event.data) as BikeStatusUpdate) : null;
          if (payload) {
            setLastUpdate(payload);
            onUpdateRef.current?.(payload);
          }
        }
        catch (error) {
          console.warn("Failed to parse bike status update", error);
        }
      });

      eventSource.addEventListener("error", (event) => {
        const normalizedError = event as ErrorEvent | TimeoutEvent | ExceptionEvent;
        const message = (normalizedError as ErrorEvent).message
          || (normalizedError as ExceptionEvent).message
          || "SSE connection error";
        onErrorRef.current?.(new Error(message));
        setIsConnected(false);
        clearReconnectTimeout();
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          if (autoConnect) {
            connect();
          }
        }, 5000);
      });

      eventSourceRef.current = eventSource;
    }
    catch (error) {
      onErrorRef.current?.(error as Error);
      clearReconnectTimeout();
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (autoConnect) {
          connect();
        }
      }, 5000);
    }
  }, [autoConnect, clearReconnectTimeout, disconnect]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
      clearReconnectTimeout();
    };
  }, [autoConnect, connect, disconnect, clearReconnectTimeout]);

  return {
    connect,
    disconnect,
    isConnected,
    lastUpdate,
  };
}
