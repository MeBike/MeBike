import { useCallback, useEffect, useMemo, useState } from "react";

import type { Rental } from "@/types/rental-types";

import { useGetRatingQuery } from "@hooks/query/rating/use-get-rating-query";
import { useRatingActions } from "@hooks/rating/use-rating-actions";

type RatingStateOptions = {
  bookingId: string;
  booking?: Rental;
};

export function useBookingRating({ bookingId, booking }: RatingStateOptions) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showAllReasons, setShowAllReasons] = useState(false);

  const endTimeDate = useMemo(() => {
    if (!booking?.endTime)
      return null;
    const parsed = new Date(booking.endTime);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [booking?.endTime]);

  const RATING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const ratingWindowExpired = useMemo(() => {
    if (!endTimeDate)
      return false;
    const nowTime = Date.now();
    const endTime = endTimeDate.getTime();
    if (Number.isNaN(endTime))
      return false;
    return nowTime > endTime + RATING_WINDOW_MS;
  }, [endTimeDate]);

  const {
    data: existingRating,
    isFetched: isRatingFetched,
  } = useGetRatingQuery(bookingId, Boolean(booking));

  const canOpenRatingForm
    = Boolean(booking)
      && booking!.status === "COMPLETED"
      && isRatingFetched
      && !hasRated
      && !ratingWindowExpired;

  const {
    ratingReasons,
    isRatingReasonsLoading,
    submitRating,
    isSubmittingRating,
    refetchRatingReasons,
  } = useRatingActions({
    enabled: Boolean(booking),
  });

  const filteredReasons = useMemo(() => {
    if (!ratingReasons || ratingReasons.length === 0)
      return [];
    if (!ratingValue)
      return ratingReasons;
    const positive = ratingValue >= 4;
    const desiredType = positive ? "COMPLIMENT" : "ISSUE";
    const matching = ratingReasons.filter(
      reason => reason.type === desiredType,
    );
    return matching.length > 0 ? matching : ratingReasons;
  }, [ratingReasons, ratingValue]);

  useEffect(() => {
    setShowAllReasons(false);
  }, [ratingValue]);

  const displayReasons = useMemo(() => {
    if (showAllReasons)
      return filteredReasons;
    return filteredReasons.slice(0, 6);
  }, [filteredReasons, showAllReasons]);

  const resetRatingState = useCallback(() => {
    setRatingValue(0);
    setSelectedReasons([]);
    setRatingComment("");
    setRatingError(null);
  }, []);

  useEffect(() => {
    setShowRatingForm(false);
    setHasRated(false);
    resetRatingState();
  }, [bookingId, resetRatingState]);

  useEffect(() => {
    if (existingRating) {
      setHasRated(true);
    }
    else if (isRatingFetched) {
      setHasRated(false);
    }
  }, [existingRating, isRatingFetched]);

  const handleToggleReason = useCallback((reasonId: string) => {
    setSelectedReasons(prev =>
      prev.includes(reasonId)
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId],
    );
  }, []);

  const handleOpenRatingForm = useCallback(() => {
    if (!canOpenRatingForm)
      return;
    setRatingError(null);
    setShowRatingForm(true);
    refetchRatingReasons();
  }, [canOpenRatingForm, refetchRatingReasons]);

  const handleCancelRating = useCallback(() => {
    resetRatingState();
    setShowRatingForm(false);
  }, [resetRatingState]);

  const handleSubmitRating = useCallback(() => {
    if (!booking?.id) {
      setRatingError("Không tìm thấy mã thuê xe để đánh giá.");
      return;
    }
    if (!ratingValue) {
      setRatingError("Vui lòng chọn số sao.");
      return;
    }
    if (selectedReasons.length === 0) {
      setRatingError("Vui lòng chọn ít nhất một lý do.");
      return;
    }
    submitRating(
      booking.id,
      {
        bikeScore: ratingValue,
        stationScore: ratingValue,
        reasonIds: selectedReasons,
        comment: ratingComment.trim() ? ratingComment.trim() : undefined,
      },
      {
        onSuccess: () => {
          setHasRated(true);
          setShowRatingForm(false);
          resetRatingState();
        },
        onAlreadyRated: () => {
          setHasRated(true);
          setShowRatingForm(false);
          resetRatingState();
        },
        onError: (message) => {
          setRatingError(message);
        },
      },
    );
  }, [
    submitRating,
    booking?.id,
    ratingValue,
    selectedReasons,
    ratingComment,
    resetRatingState,
  ]);

  const getAppliesTo = (appliesTo: string) => {
    switch (appliesTo) {
      case "app":
        return "Ứng dụng";
      case "station":
        return "Trạm xe";
      case "bike":
        return "Xe đạp";
      default:
        return appliesTo;
    }
  };

  return {
    ratingState: {
      hasRated,
      existingRating,
      canOpenRatingForm,
      ratingWindowExpired,
      showRatingForm,
      ratingValue,
      selectedReasons,
      ratingComment,
      ratingError,
      showAllReasons,
      ratingReasons,
      isRatingReasonsLoading,
      isSubmittingRating,
      displayReasons,
      filteredReasons,
      setRatingValue,
      setRatingError,
      setShowAllReasons,
      handleToggleReason,
      setRatingComment,
      handleCancelRating,
      handleSubmitRating,
      handleOpenRatingForm,
      getAppliesTo,
    },
    isFetchingRating: !isRatingFetched,
  };
}
