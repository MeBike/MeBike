import { useBikeStatusStreamContext } from "@providers/bike-status-stream-provider";
import { useEffect } from "react";

import type { BikeStatusUpdate } from "@/hooks/use-bike-status-stream";

type Options = {
  enabled?: boolean;
};

export function useBikeStatusEvents(onUpdate: (payload: BikeStatusUpdate) => void, options?: Options) {
  const { enabled = true } = options ?? {};
  const { subscribe, lastUpdate } = useBikeStatusStreamContext();

  useEffect(() => {
    if (!enabled)
      return;
    const unsubscribe = subscribe(onUpdate);
    return () => unsubscribe();
  }, [enabled, onUpdate, subscribe]);

  return { lastUpdate };
}
