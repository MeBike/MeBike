import { useEffect } from "react";

import type { ReturnSlotExpiredUpdate } from "@/hooks/use-bike-status-stream";

import { useBikeStatusStreamContext } from "@providers/bike-status-stream-provider";

type Options = {
  enabled?: boolean;
};

export function useReturnSlotExpiredEvents(
  onExpired: (payload: ReturnSlotExpiredUpdate) => void,
  options?: Options,
) {
  const { enabled = true } = options ?? {};
  const { subscribeReturnSlotExpired, lastReturnSlotExpired } = useBikeStatusStreamContext();

  useEffect(() => {
    if (!enabled)
      return;
    const unsubscribe = subscribeReturnSlotExpired(onExpired);
    return () => unsubscribe();
  }, [enabled, onExpired, subscribeReturnSlotExpired]);

  return { lastReturnSlotExpired };
}
