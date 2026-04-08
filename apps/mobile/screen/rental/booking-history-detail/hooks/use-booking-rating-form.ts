import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { CreateRatingPayload, RatingReason } from "@services/ratings";

import { useRatingActions } from "@hooks/rating/use-rating-actions";

type SubmitRatingCallbacks = {
  onAlreadyRated?: () => void;
  onSuccess?: () => void;
};

type SubmitRatingOptions = SubmitRatingCallbacks & {
  rentalId?: string;
};

type BookingRatingFormValues = {
  bikeScore: number;
  stationScore: number;
  reasonIds: string[];
  comment: string;
};

const defaultValues: BookingRatingFormValues = {
  bikeScore: 0,
  stationScore: 0,
  reasonIds: [],
  comment: "",
};

function getReasonTypeForScore(score: number) {
  return score >= 4 ? "COMPLIMENT" : "ISSUE";
}

function filterReasonsForScores(
  reasons: RatingReason[],
  bikeScore: number,
  stationScore: number,
) {
  if (!reasons.length || !bikeScore || !stationScore) {
    return [];
  }

  const bikeType = getReasonTypeForScore(bikeScore);
  const stationType = getReasonTypeForScore(stationScore);

  return [
    ...reasons.filter(reason => reason.appliesTo === "bike" && reason.type === bikeType),
    ...reasons.filter(reason => reason.appliesTo === "station" && reason.type === stationType),
  ];
}

function pruneUnavailableReasonIds(reasonIds: string[], reasons: RatingReason[]) {
  if (!reasons.length) {
    return [];
  }

  const availableReasonIds = new Set(reasons.map(reason => reason.id));
  return reasonIds.filter(reasonId => availableReasonIds.has(reasonId));
}

function shouldResetSelectedReasons(previousScore: number, nextScore: number) {
  return previousScore > 0 && getReasonTypeForScore(previousScore) !== getReasonTypeForScore(nextScore);
}

function toggleReasonId(reasonIds: string[], reasonId: string) {
  return reasonIds.includes(reasonId)
    ? reasonIds.filter(id => id !== reasonId)
    : [...reasonIds, reasonId];
}

function validateSubmission(rentalId: string | undefined, values: BookingRatingFormValues) {
  if (!rentalId) {
    return "Không tìm thấy mã thuê xe để đánh giá.";
  }

  if (!values.bikeScore || !values.stationScore) {
    return "Vui lòng chọn đủ điểm cho xe đạp và trạm.";
  }

  if (values.reasonIds.length === 0) {
    return "Vui lòng chọn ít nhất một lý do.";
  }

  return null;
}

function toRatingPayload(values: BookingRatingFormValues): CreateRatingPayload {
  return {
    bikeScore: values.bikeScore,
    stationScore: values.stationScore,
    reasonIds: values.reasonIds,
    comment: values.comment.trim() ? values.comment.trim() : undefined,
  };
}

export function useBookingRatingForm({ bookingId, enabled }: { bookingId: string; enabled: boolean }) {
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showAllReasons, setShowAllReasons] = useState(false);

  const form = useForm<BookingRatingFormValues>({
    defaultValues,
  });
  const { control, getValues, reset, setValue } = form;

  const watchedValues = useWatch({
    control,
    defaultValue: defaultValues,
  }) as BookingRatingFormValues;
  const {
    bikeScore,
    stationScore,
    reasonIds: selectedReasons,
    comment: ratingComment,
  } = watchedValues;

  const {
    ratingReasons,
    isRatingReasonsLoading,
    submitRating,
    isSubmittingRating,
    refetchRatingReasons,
  } = useRatingActions({
    enabled,
  });

  const filteredReasons = useMemo(
    () => filterReasonsForScores(ratingReasons, bikeScore, stationScore),
    [bikeScore, ratingReasons, stationScore],
  );

  const displayReasons = useMemo(() => {
    return showAllReasons ? filteredReasons : filteredReasons.slice(0, 6);
  }, [filteredReasons, showAllReasons]);

  const canSubmit = bikeScore > 0 && stationScore > 0 && selectedReasons.length > 0;

  const resetForm = useCallback(() => {
    reset(defaultValues);
    setRatingError(null);
    setShowAllReasons(false);
  }, [reset]);

  const clearError = useCallback(() => {
    setRatingError(null);
  }, []);

  const handleCommentChange = useCallback((value: string) => {
    setValue("comment", value);
  }, [setValue]);

  const handleToggleReason = useCallback((reasonId: string) => {
    setRatingError(null);
    setValue("reasonIds", toggleReasonId(selectedReasons, reasonId));
  }, [selectedReasons, setValue]);

  const handleBikeScoreChange = useCallback((value: number) => {
    setRatingError(null);

    const nextReasonIds = shouldResetSelectedReasons(bikeScore, value)
      ? []
      : getValues("reasonIds");

    setValue("bikeScore", value);
    setValue("reasonIds", nextReasonIds);
  }, [bikeScore, getValues, setValue]);

  const handleStationScoreChange = useCallback((value: number) => {
    setRatingError(null);

    const nextReasonIds = shouldResetSelectedReasons(stationScore, value)
      ? []
      : getValues("reasonIds");

    setValue("stationScore", value);
    setValue("reasonIds", nextReasonIds);
  }, [getValues, setValue, stationScore]);

  const submitForm = useCallback((options: SubmitRatingOptions) => {
    const { onAlreadyRated, onSuccess, rentalId } = options;
    const values = getValues();
    const validationMessage = validateSubmission(rentalId, values);

    if (validationMessage) {
      setRatingError(validationMessage);
      return;
    }

    submitRating(rentalId!, toRatingPayload(values), {
      onAlreadyRated,
      onError: message => setRatingError(message),
      onSuccess,
    });
  }, [getValues, submitRating]);

  useEffect(() => {
    resetForm();
  }, [bookingId, resetForm]);

  useEffect(() => {
    setShowAllReasons(false);
  }, [bikeScore, stationScore]);

  useEffect(() => {
    const nextReasonIds = pruneUnavailableReasonIds(selectedReasons, filteredReasons);

    if (nextReasonIds.length !== selectedReasons.length) {
      setValue("reasonIds", nextReasonIds);
    }
  }, [filteredReasons, selectedReasons, setValue]);

  return {
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
    onChangeComment: handleCommentChange,
    onShowAllReasons: () => setShowAllReasons(true),
    onChangeBikeScore: handleBikeScoreChange,
    onChangeStationScore: handleStationScoreChange,
    onToggleReason: handleToggleReason,
    handleSubmit: submitForm,
    refetchRatingReasons,
    resetForm,
    clearError,
  };
}
