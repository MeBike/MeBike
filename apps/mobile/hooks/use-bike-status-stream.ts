import type { ErrorEvent, ExceptionEvent, TimeoutEvent } from "react-native-sse";

import { API_BASE_URL } from "@lib/api-base-url";
import { clearTokens, getAccessToken } from "@lib/auth-tokens";
import { refreshAccessToken } from "@lib/ky-client";
import { log } from "@lib/log";
import { StatusCodes } from "http-status-codes";
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

const SSE_UNAUTHORIZED_ERROR = "SSE_UNAUTHORIZED";

export function useBikeStatusStream(options?: UseBikeStatusStreamOptions) {
  const { autoConnect = true, onUpdate, onError } = options ?? {};
  const [lastUpdate, setLastUpdate] = useState<BikeStatusUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const eventSourceRef = useRef<EventSource<CustomEventName> | null>(null);
  const onUpdateRef = useRef<typeof onUpdate>(onUpdate);
  const onErrorRef = useRef<typeof onError>(onError);
  const suppressReconnectRef = useRef(false);
  const isRecoveringAuthRef = useRef(false);
  const reconnectRef = useRef<(() => Promise<void>) | null>(null);

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

  const recoverFromUnauthorized = useCallback(async () => {
    if (isRecoveringAuthRef.current) {
      return;
    }

    isRecoveringAuthRef.current = true;
    disconnect();
    let shouldReconnect = false;

    try {
      const nextToken = await refreshAccessToken();

      if (nextToken) {
        suppressReconnectRef.current = false;
        log.info("SSE token refreshed; reconnecting");
        shouldReconnect = true;
        return;
      }

      suppressReconnectRef.current = true;
      await clearTokens();
      onErrorRef.current?.(new Error(SSE_UNAUTHORIZED_ERROR));
    }
    finally {
      isRecoveringAuthRef.current = false;

      if (shouldReconnect) {
        void reconnectRef.current?.();
      }
    }
  }, [disconnect]);

  const connect = useCallback(async () => {
    if (isRecoveringAuthRef.current) {
      return;
    }

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
      const token = await getAccessToken();

      if (!token) {
        suppressReconnectRef.current = true;
        setIsConnected(false);
        setIsConnecting(false);
        log.info("SSE connect skipped", { reason: "missing_access_token" });
        return;
      }

      disconnect();
      setIsConnecting(true);
      log.info("SSE connecting", { url: `${API_BASE_URL}/events` });

      const eventSource = new EventSource<CustomEventName>(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
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
        const xhrStatus = "xhrStatus" in normalizedError ? normalizedError.xhrStatus : undefined;
        const message = (normalizedError as ErrorEvent).message
          || (normalizedError as ExceptionEvent).message
          || "SSE connection error";
        log.warn("SSE error", { message, xhrStatus });
        setIsConnected(false);
        setIsConnecting(false);

        if (xhrStatus === StatusCodes.UNAUTHORIZED) {
          void recoverFromUnauthorized();
          return;
        }

        if (xhrStatus === StatusCodes.FORBIDDEN) {
          suppressReconnectRef.current = true;
          disconnect();
          onErrorRef.current?.(new Error(SSE_UNAUTHORIZED_ERROR));
          return;
        }

        onErrorRef.current?.(new Error(message));
      });

      eventSourceRef.current = eventSource;
    }
    catch (error) {
      log.warn("SSE connection failed", error);
      onErrorRef.current?.(error as Error);
      if (error instanceof Error && error.message === SSE_UNAUTHORIZED_ERROR) {
        suppressReconnectRef.current = true;
        return;
      }
      setIsConnecting(false);
    }
  }, [disconnect, recoverFromUnauthorized]);

  useEffect(() => {
    reconnectRef.current = connect;
  }, [connect]);

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
