import { useBikeStatusEvents } from "@hooks/useBikeStatusEvents";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { BikeStatusUpdate } from "@/hooks/use-bike-status-stream";
import type { Rental } from "@/types/rental-types";

type Options = {
  booking?: Rental;
  hasToken: boolean;
  refetchDetail: () => Promise<unknown> | unknown;
};

export function useRentalStatusWatcher({
  booking,
  hasToken,
  refetchDetail,
}: Options) {
  const queryClient = useQueryClient();
  const bikeId = booking?.bikeId;

  const handleRealtimeUpdate = useCallback(
    (payload: BikeStatusUpdate) => {
      if (!bikeId)
        return;
      const isTargetBike = payload.bikeId === bikeId;
      const isRelevantStatus
        = payload.status === "CÓ SẴN" || payload.status === "ĐANG ĐƯỢC THUÊ";

      if (isTargetBike && isRelevantStatus) {
        refetchDetail();
        queryClient.invalidateQueries({ queryKey: ["rentals", "me"] });
        queryClient.invalidateQueries({ queryKey: ["rentals", "me", "history"] });
        queryClient.invalidateQueries({ queryKey: ["rentals", "me", "detail", booking?.id] });
      }
    },
    [bikeId, booking?.id, queryClient, refetchDetail],
  );

  useBikeStatusEvents(handleRealtimeUpdate, {
    enabled: hasToken && Boolean(bikeId) && booking?.status === "RENTED",
  });
}
