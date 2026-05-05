import { useEffect } from "react";

import type { ReturnSlotExpiredUpdate } from "@/types/realtime-events";

import { useRealtimeEventContext } from "@providers/realtime-event-provider";

type Options = {
  enabled?: boolean;
};

export function useReturnSlotExpiredEvents(
  onExpired: (payload: ReturnSlotExpiredUpdate) => void,
  options?: Options,
) {
  const { enabled = true } = options ?? {};
  const { subscribeReturnSlotExpired, lastReturnSlotExpired } = useRealtimeEventContext();

  useEffect(() => {
    if (!enabled)
      return;
    const unsubscribe = subscribeReturnSlotExpired(onExpired);
    return () => unsubscribe();
  }, [enabled, onExpired, subscribeReturnSlotExpired]);

  return { lastReturnSlotExpired };
}
