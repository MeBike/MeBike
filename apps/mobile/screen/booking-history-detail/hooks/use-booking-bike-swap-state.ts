import { useMyBikeSwapPreview } from "@hooks/rentals/use-my-bike-swap-preview";
import { useMyBikeSwapRequestQuery } from "@hooks/rentals/use-my-bike-swap-request-query";
import { getBikeChipDisplay } from "@utils/bike";
import { useEffect } from "react";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

type UseBookingBikeSwapStateOptions = {
  bookingId: string;
  booking?: MyRentalResolvedDetail["rental"];
  detail?: MyRentalResolvedDetail;
};

type BookingBikeSwapStatus = "NONE" | "PENDING" | "CONFIRMED" | "REJECTED";

export function useBookingBikeSwapState({
  bookingId,
  booking,
  detail,
}: UseBookingBikeSwapStateOptions) {
  const isOngoing = booking?.status === "RENTED";
  const { preview: bikeSwapPreview, setPreviewStatus } = useMyBikeSwapPreview(bookingId);

  const bikeSwapRequestQuery = useMyBikeSwapRequestQuery({
    rentalId: bookingId,
    requestId: bikeSwapPreview?.requestId,
    enabled: isOngoing,
  });
  const bikeSwapRequest = bikeSwapRequestQuery.data ?? null;

  const bikeSwapStatus: BookingBikeSwapStatus = bikeSwapRequest
    ? bikeSwapRequest.status === "PENDING"
      ? "PENDING"
      : bikeSwapRequest.status === "CONFIRMED"
        ? "CONFIRMED"
        : bikeSwapRequest.status === "REJECTED"
          ? "REJECTED"
          : "NONE"
    : bikeSwapPreview?.status === "PENDING"
      ? "PENDING"
      : "NONE";

  const confirmedBikeLabel = bikeSwapRequest?.newBike
    ? getBikeChipDisplay(bikeSwapRequest.newBike)
    : detail?.bike
      ? getBikeChipDisplay(detail.bike)
      : undefined;

  useEffect(() => {
    if (!bikeSwapPreview || !bikeSwapRequest || bikeSwapPreview.status === bikeSwapRequest.status) {
      return;
    }

    setPreviewStatus(bikeSwapRequest.status);
  }, [bikeSwapPreview, bikeSwapRequest, setPreviewStatus]);

  return {
    bikeSwapPreview,
    bikeSwapRequest,
    bikeSwapRequestQuery,
    bikeSwapStatus,
    confirmedBikeLabel,
    isBikeSwapPending: bikeSwapStatus === "PENDING",
  };
}
