import { useCallback, useMemo } from "react";

import type { Rental } from "@/types/rental-types";

import type { RentalRatingCardState } from "../components/rental-rating-card";

import { useBookingRatingForm } from "./use-booking-rating-form";
import { useBookingRatingStatus } from "./use-booking-rating-status";

type UseBookingRatingOptions = {
  bookingId: string;
  booking?: Rental;
};

export function useBookingRating({ bookingId, booking }: UseBookingRatingOptions) {
  const {
    availability,
    existingRating,
    isRefetchingRating,
    showRatingForm,
    openRatingForm,
    closeRatingForm,
    markAsRated,
    refetchRating,
  } = useBookingRatingStatus({
    bookingId,
    booking,
  });

  const {
    bikeScore,
    stationScore,
    selectedReasons,
    ratingComment,
    ratingError,
    showAllReasons,
    displayReasons,
    filteredReasons,
    canSubmit,
    isRatingReasonsLoading,
    isSubmittingRating,
    onChangeComment,
    onShowAllReasons,
    onChangeBikeScore,
    onChangeStationScore,
    onToggleReason,
    handleSubmit,
    refetchRatingReasons,
    resetForm,
    clearError,
  } = useBookingRatingForm({
    bookingId,
    enabled: Boolean(booking),
  });

  const handleOpenRatingForm = useCallback(() => {
    const didOpen = openRatingForm();

    if (!didOpen) {
      return;
    }

    clearError();
    refetchRatingReasons();
  }, [clearError, openRatingForm, refetchRatingReasons]);

  const handleCloseRatingForm = useCallback(() => {
    resetForm();
    closeRatingForm();
  }, [closeRatingForm, resetForm]);

  const handleSubmitRating = useCallback(() => {
    handleSubmit({
      rentalId: booking?.id,
      onAlreadyRated: () => {
        markAsRated();
        closeRatingForm();
        resetForm();
      },
      onSuccess: () => {
        markAsRated();
        closeRatingForm();
        resetForm();
      },
    });
  }, [booking?.id, closeRatingForm, handleSubmit, markAsRated, resetForm]);

  const cardState = useMemo<RentalRatingCardState>(() => {
    switch (availability) {
      case "checking":
        return { kind: "checking" };
      case "not-completed":
        return { kind: "not-completed" };
      case "expired":
        return { kind: "expired" };
      case "rated":
        return { kind: "rated", rating: existingRating };
      case "error":
        return {
          kind: "error",
          onRetry: () => {
            void refetchRating();
          },
        };
      case "ready":
        return { kind: "ready", onPress: handleOpenRatingForm };
      default:
        return { kind: "checking" };
    }
  }, [
    availability,
    existingRating,
    handleOpenRatingForm,
    refetchRating,
  ]);

  const sheet = useMemo(() => ({
    visible: showRatingForm,
    bikeScore,
    canSubmit,
    displayReasons,
    filteredReasons,
    isRatingReasonsLoading,
    isSubmittingRating,
    onChangeComment,
    onChangeBikeScore,
    onChangeStationScore,
    onClose: handleCloseRatingForm,
    onShowAllReasons,
    onSubmit: handleSubmitRating,
    onToggleReason,
    ratingComment,
    ratingError,
    selectedReasons,
    showAllReasons,
    stationScore,
  }), [
    showRatingForm,
    bikeScore,
    canSubmit,
    displayReasons,
    filteredReasons,
    handleCloseRatingForm,
    handleSubmitRating,
    isRatingReasonsLoading,
    isSubmittingRating,
    onChangeBikeScore,
    onChangeComment,
    onChangeStationScore,
    onShowAllReasons,
    onToggleReason,
    ratingComment,
    ratingError,
    selectedReasons,
    showAllReasons,
    stationScore,
  ]);

  return {
    cardState,
    sheet,
    refresh: () => refetchRating(),
    isRefreshing: isRefetchingRating,
  };
}
