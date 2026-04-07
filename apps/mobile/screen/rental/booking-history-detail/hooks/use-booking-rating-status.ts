import { useCallback, useEffect, useMemo, useState } from "react";

import type { Rental } from "@/types/rental-types";

import { useGetRatingQuery } from "@hooks/query/rating/use-get-rating-query";

type UseBookingRatingStatusOptions = {
  bookingId: string;
  booking?: Rental;
};

export type RatingAvailability
  = | "checking"
    | "not-completed"
    | "expired"
    | "rated"
    | "ready"
    | "error";

const RATING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function useBookingRatingStatus({ bookingId, booking }: UseBookingRatingStatusOptions) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [hasLocalRated, setHasLocalRated] = useState(false);

  const endTimeDate = useMemo(() => {
    if (!booking?.endTime) {
      return null;
    }

    const parsed = new Date(booking.endTime);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [booking?.endTime]);

  const ratingWindowExpired = useMemo(() => {
    if (!endTimeDate) {
      return false;
    }

    const endTime = endTimeDate.getTime();
    if (Number.isNaN(endTime)) {
      return false;
    }

    return Date.now() > endTime + RATING_WINDOW_MS;
  }, [endTimeDate]);

  const {
    data: existingRating,
    isError: isRatingError,
    isFetched: isRatingFetched,
    isRefetching: isRefetchingRating,
    refetch: refetchRating,
  } = useGetRatingQuery(bookingId, Boolean(booking));

  useEffect(() => {
    setShowRatingForm(false);
    setHasLocalRated(false);
  }, [bookingId]);

  const hasRated = hasLocalRated || Boolean(existingRating);

  const availability = useMemo<RatingAvailability>(() => {
    if (!booking) {
      return "checking";
    }

    if (booking.status !== "COMPLETED") {
      return "not-completed";
    }

    if (!isRatingFetched) {
      return "checking";
    }

    if (isRatingError) {
      return "error";
    }

    if (hasRated) {
      return "rated";
    }

    if (ratingWindowExpired) {
      return "expired";
    }

    return "ready";
  }, [booking, hasRated, isRatingError, isRatingFetched, ratingWindowExpired]);

  const canOpenRatingForm = availability === "ready";

  const openRatingForm = useCallback(() => {
    if (!canOpenRatingForm) {
      return false;
    }

    setShowRatingForm(true);
    return true;
  }, [canOpenRatingForm]);

  const closeRatingForm = useCallback(() => {
    setShowRatingForm(false);
  }, []);

  const markAsRated = useCallback(() => {
    setHasLocalRated(true);
  }, []);

  return {
    availability,
    existingRating,
    hasRated,
    isFetchingRating: !isRatingFetched,
    isRefetchingRating,
    showRatingForm,
    ratingWindowExpired,
    canOpenRatingForm,
    openRatingForm,
    closeRatingForm,
    markAsRated,
    refetchRating,
  };
}
