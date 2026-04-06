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
  const [bikeScore, setBikeScore] = useState<number>(0);
  const [stationScore, setStationScore] = useState<number>(0);
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
    if (!bikeScore || !stationScore)
      return [];

    const bikeType = bikeScore >= 4 ? "COMPLIMENT" : "ISSUE";
    const stationType = stationScore >= 4 ? "COMPLIMENT" : "ISSUE";

    return [
      ...ratingReasons.filter(reason => reason.appliesTo === "bike" && reason.type === bikeType),
      ...ratingReasons.filter(reason => reason.appliesTo === "station" && reason.type === stationType),
    ];
  }, [bikeScore, ratingReasons, stationScore]);

  useEffect(() => {
    setShowAllReasons(false);
  }, [bikeScore, stationScore]);

  useEffect(() => {
    if (filteredReasons.length === 0) {
      setSelectedReasons([]);
      return;
    }

    const availableReasonIds = new Set(filteredReasons.map(reason => reason.id));
    setSelectedReasons(prev => prev.filter(reasonId => availableReasonIds.has(reasonId)));
  }, [filteredReasons]);

  const displayReasons = useMemo(() => {
    if (showAllReasons)
      return filteredReasons;
    return filteredReasons.slice(0, 6);
  }, [filteredReasons, showAllReasons]);

  const canSubmit = bikeScore > 0 && stationScore > 0 && selectedReasons.length > 0;

  const resetRatingState = useCallback(() => {
    setBikeScore(0);
    setStationScore(0);
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
    setRatingError(null);
    setSelectedReasons(prev =>
      prev.includes(reasonId)
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId],
    );
  }, []);

  const handleBikeScoreChange = useCallback((value: number) => {
    setRatingError(null);
    setSelectedReasons((prev) => {
      if (bikeScore > 0 && (bikeScore >= 4) !== (value >= 4)) {
        return [];
      }

      return prev;
    });
    setBikeScore(value);
  }, [bikeScore]);

  const handleStationScoreChange = useCallback((value: number) => {
    setRatingError(null);
    setSelectedReasons((prev) => {
      if (stationScore > 0 && (stationScore >= 4) !== (value >= 4)) {
        return [];
      }

      return prev;
    });
    setStationScore(value);
  }, [stationScore]);

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
    if (!bikeScore || !stationScore) {
      setRatingError("Vui lòng chọn đủ điểm cho xe đạp và trạm.");
      return;
    }
    if (selectedReasons.length === 0) {
      setRatingError("Vui lòng chọn ít nhất một lý do.");
      return;
    }
    submitRating(
      booking.id,
      {
        bikeScore,
        stationScore,
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
    bikeScore,
    stationScore,
    selectedReasons,
    ratingComment,
    resetRatingState,
  ]);

  return {
    ratingState: {
      hasRated,
      existingRating,
      canOpenRatingForm,
      canSubmit,
      ratingWindowExpired,
      showRatingForm,
      bikeScore,
      stationScore,
      selectedReasons,
      ratingComment,
      ratingError,
      showAllReasons,
      ratingReasons,
      isRatingReasonsLoading,
      isSubmittingRating,
      displayReasons,
      filteredReasons,
      setRatingError,
      setShowAllReasons,
      handleBikeScoreChange,
      handleStationScoreChange,
      handleToggleReason,
      setRatingComment,
      handleCancelRating,
      handleSubmitRating,
      handleOpenRatingForm,
    },
    isFetchingRating: !isRatingFetched,
  };
}
