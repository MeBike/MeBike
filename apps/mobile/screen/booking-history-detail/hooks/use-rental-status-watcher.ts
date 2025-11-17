import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useBikeStatusStream } from "@hooks/useBikeStatusStream";
import type { BikeStatusUpdate } from "@hooks/useBikeStatusStream";

import type { RentalDetail } from "@/types/RentalTypes";

type Options = {
  booking?: RentalDetail;
  hasToken: boolean;
  refetchDetail: () => Promise<unknown> | unknown;
};

export function useRentalStatusWatcher({
  booking,
  hasToken,
  refetchDetail,
}: Options) {
  const queryClient = useQueryClient();
  const bikeId = booking?.bike?._id;

  const handleRealtimeUpdate = useCallback(
    (payload: BikeStatusUpdate) => {
      if (!bikeId) return;
      if (payload.bikeId === bikeId && payload.status === "CÓ SẴN") {
        refetchDetail();
        queryClient.invalidateQueries({ queryKey: ["rentals"] });
        queryClient.invalidateQueries({ queryKey: ["rentals", "all"] });
      }
    },
    [bikeId, queryClient, refetchDetail]
  );

  useBikeStatusStream({
    autoConnect:
      hasToken && Boolean(bikeId) && booking?.status === "ĐANG THUÊ",
    onUpdate: handleRealtimeUpdate,
    onError: (error) => {
      console.warn("[SSE] booking detail stream error", error);
    },
  });
}

