import { useCallback, useEffect, useMemo, useState } from "react";

import { useGetRatingQuery } from "@hooks/query/Rating/useGetRatingQuery";
import { useRatingActions } from "@hooks/useRatingActions";

import type { RentalDetail } from "@/types/RentalTypes";

type RatingStateOptions = {
  bookingId: string;
  booking?: RentalDetail;
};

export function useBookingRating({ bookingId, booking }: RatingStateOptions) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showAllReasons, setShowAllReasons] = useState(false);

  const endTimeDate = useMemo(() => {
    if (!booking?.end_time) return null;
    const parsed = new Date(booking.end_time);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [booking?.end_time]);

  const RATING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const ratingWindowExpired = useMemo(() => {
    if (!endTimeDate) return false;
    const nowTime = Date.now();
    const endTime = endTimeDate.getTime();
    if (Number.isNaN(endTime)) return false;
    return nowTime > endTime + RATING_WINDOW_MS;
  }, [endTimeDate]);

  const canOpenRatingForm =
    Boolean(booking) &&
    booking!.status === "HOÀN THÀNH" &&
    !hasRated &&
    !ratingWindowExpired;

  const {
    ratingReasons,
    isRatingReasonsLoading,
    submitRating,
    isSubmittingRating,
    refetchRatingReasons,
  } = useRatingActions({
    enabled: showRatingForm && Boolean(booking),
  });

  const { data: existingRating } = useGetRatingQuery(
    bookingId,
    Boolean(booking)
  );

  const filteredReasons = useMemo(() => {
    if (!ratingReasons || ratingReasons.length === 0) return [];
    if (!ratingValue) return ratingReasons;
    const positive = ratingValue >= 4;
    const desiredType = positive ? "Khen ngợi" : "Vấn đề";
    const matching = ratingReasons.filter(
      (reason) => reason.type === desiredType
    );
    return matching.length > 0 ? matching : ratingReasons;
  }, [ratingReasons, ratingValue]);

  useEffect(() => {
    setShowAllReasons(false);
  }, [ratingValue]);

  const displayReasons = useMemo(() => {
    if (showAllReasons) return filteredReasons;
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
  }, [existingRating]);

  const handleToggleReason = useCallback((reasonId: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonId)
        ? prev.filter((id) => id !== reasonId)
        : [...prev, reasonId]
    );
  }, []);

  const handleOpenRatingForm = useCallback(() => {
    if (!canOpenRatingForm) return;
    setRatingError(null);
    setShowRatingForm(true);
    refetchRatingReasons();
  }, [canOpenRatingForm, refetchRatingReasons]);

  const handleCancelRating = useCallback(() => {
    resetRatingState();
    setShowRatingForm(false);
  }, [resetRatingState]);

  const handleSubmitRating = useCallback(() => {
    if (!booking?._id) {
      setRatingError("Không tìm thấy mã thuê xe để đánh giá.");
      return;
    }
    if (!ratingValue) {
      setRatingError("Vui lòng chọn số sao.");
      return;
    }
    submitRating(
      booking._id,
      {
        rating: ratingValue,
        reason_ids: selectedReasons,
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
      }
    );
  }, [
    submitRating,
    booking?._id,
    ratingValue,
    selectedReasons,
    ratingComment,
    resetRatingState,
  ]);

  const getAppliesTo = (appliesTo: string) => {
    switch (appliesTo) {
      case "App":
        return "Ứng dụng";
      case "Station":
        return "Trạm xe";
      case "Bike":
        return "Xe đạp";
      default:
        return appliesTo;
    }
  };

  const openModal = useCallback(() => setShowRatingModal(true), []);
  const closeModal = useCallback(() => setShowRatingModal(false), []);
  const markRated = useCallback(() => setHasRated(true), []);

  return {
    ratingModal: {
      visible: showRatingModal,
      open: openModal,
      close: closeModal,
      markRated,
    },
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
  };
}
