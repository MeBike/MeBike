import type { ErrorEvent, ExceptionEvent, TimeoutEvent } from "react-native-sse";

import { API_BASE_URL } from "@lib/api-base-url";
import { clearTokens, getAccessToken } from "@lib/auth-tokens";
import { log } from "@lib/log";
import { useCallback, useEffect, useRef, useState } from "react";
import EventSource from "react-native-sse";

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
  const [isConnecting, setIsConnecting] = useState(false);
  const eventSourceRef = useRef<EventSource<CustomEventName> | null>(null);
  const onUpdateRef = useRef<typeof onUpdate>(onUpdate);
  const onErrorRef = useRef<typeof onError>(onError);
  const suppressReconnectRef = useRef(false);

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
    setIsConnecting(false);
    log.info("SSE disconnected");
  }, []);

  const connect = useCallback(async () => {
    if (suppressReconnectRef.current) {
      const tokenCheck = await getAccessToken();
      if (tokenCheck) {
        suppressReconnectRef.current = false;
      }
      else {
        return;
      }
    }
    try {
      disconnect();
      setIsConnecting(true);
      log.info("SSE connecting", { url: `${API_BASE_URL}/events` });
      const token = await getAccessToken();
      const eventSource = new EventSource<CustomEventName>(`${API_BASE_URL}/events`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: false,
        timeoutBeforeConnection: 5000,
        pollingInterval: 5000,
      });

      eventSource.addEventListener("open", () => {
        log.info("SSE connected");
        setIsConnected(true);
        setIsConnecting(false);
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
          log.warn("Failed to parse bike status update", error);
        }
      });

      eventSource.addEventListener("error", (event) => {
        const normalizedError = event as ErrorEvent | TimeoutEvent | ExceptionEvent;
        const message = (normalizedError as ErrorEvent).message
          || (normalizedError as ExceptionEvent).message
          || "SSE connection error";
        log.warn("SSE error", { message });
        onErrorRef.current?.(new Error(message));
        setIsConnected(false);
        setIsConnecting(false);

        const isExpired = typeof message === "string" && message.toLowerCase().includes("jwt expired");
        if (isExpired) {
          suppressReconnectRef.current = true;
          void clearTokens();
        }
      });

      eventSourceRef.current = eventSource;
    }
    catch (error) {
      log.warn("SSE connection failed", error);
      onErrorRef.current?.(error as Error);
      if (error instanceof Error && error.message.toLowerCase?.().includes("jwt expired")) {
        suppressReconnectRef.current = true;
        void clearTokens();
        return;
      }
      setIsConnecting(false);
    }
  }, [disconnect]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    lastUpdate,
  };
}
