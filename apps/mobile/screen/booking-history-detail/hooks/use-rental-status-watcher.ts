import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { BikeStatusUpdate } from "@hooks/useBikeStatusStream";
import { useBikeStatusEvents } from "@hooks/useBikeStatusEvents";

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
      const isTargetBike = payload.bikeId === bikeId;
      const isRelevantStatus =
        payload.status === "CÓ SẴN" || payload.status === "ĐANG ĐƯỢC THUÊ";

      if (isTargetBike && isRelevantStatus) {
        refetchDetail();
        queryClient.invalidateQueries({ queryKey: ["rentals"] });
        queryClient.invalidateQueries({ queryKey: ["rentals", "all"] });
        queryClient.invalidateQueries({ queryKey: ["rentals", "detail", booking?._id] });
      }
    },
    [bikeId, booking?._id, queryClient, refetchDetail]
  );

  useBikeStatusEvents(handleRealtimeUpdate, {
    enabled: hasToken && Boolean(bikeId) && booking?.status === "ĐANG THUÊ",
  });
}
