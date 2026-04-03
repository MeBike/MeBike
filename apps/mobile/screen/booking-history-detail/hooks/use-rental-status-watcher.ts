import { invalidateMyRentalQueries } from "@hooks/rentals/rental-cache";
import { useBikeStatusEvents } from "@hooks/useBikeStatusEvents";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { BikeStatusUpdate } from "@/hooks/use-bike-status-stream";
import type { MyRentalResolvedDetail } from "@/types/rental-types";

type Options = {
  booking?: MyRentalResolvedDetail["rental"];
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
        void invalidateMyRentalQueries(queryClient);
      }
    },
    [bikeId, booking?.id, queryClient, refetchDetail],
  );

  useBikeStatusEvents(handleRealtimeUpdate, {
    enabled: hasToken && Boolean(bikeId) && booking?.status === "RENTED",
  });
}
