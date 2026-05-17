import { useEffect } from "react";

import type { BikeStatusUpdate } from "@/types/realtime-events";

import { useRealtimeEventContext } from "@providers/realtime-event-provider";

type Options = {
  enabled?: boolean;
};

export function useBikeStatusEvents(onUpdate: (payload: BikeStatusUpdate) => void, options?: Options) {
  const { enabled = true } = options ?? {};
  const { subscribeBikeStatus, lastBikeStatusUpdate } = useRealtimeEventContext();

  useEffect(() => {
    if (!enabled)
      return;
    const unsubscribe = subscribeBikeStatus(onUpdate);
    return () => unsubscribe();
  }, [enabled, onUpdate, subscribeBikeStatus]);

  return { lastUpdate: lastBikeStatusUpdate };
}
