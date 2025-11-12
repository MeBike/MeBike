import RatingModal from "@components/RatingModal";
import { useGetRatingQuery } from "@hooks/query/Rating/useGetRatingQuery";
import { useRatingActions } from "@hooks/useRatingActions";
import { useRentalsActions } from "@hooks/useRentalAction";
import { useStationActions } from "@hooks/useStationAction";
import { useWalletActions } from "@hooks/useWalletAction";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import type { RentalDetail } from "../types/RentalTypes";
import type { StationType } from "../types/StationType";
import ActionButtons from "../components/booking-history-detail/components/ActionButtons";
import BikeInfoCard from "../components/booking-history-detail/components/BikeInfoCard";
import BookingDetailHeader from "../components/booking-history-detail/components/BookingDetailHeader";
import BookingIdCard from "../components/booking-history-detail/components/BookingIdCard";
import ErrorState from "../components/booking-history-detail/components/ErrorState";
import LoadingState from "../components/booking-history-detail/components/LoadingState";
import PaymentInfoCard from "../components/booking-history-detail/components/PaymentInfoCard";
import RatingSection from "../components/booking-history-detail/components/RatingSection";
import StatusCard from "../components/booking-history-detail/components/StatusCard";
import TimeInfoCard from "../components/booking-history-detail/components/TimeInfoCard";
import UserInfoCard from "../components/booking-history-detail/components/UserInfoCard";

type RouteParams = {
  bookingId: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

function BookingHistoryDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as RouteParams;
  const { getMyWallet } = useWalletActions(true);
  const {
    stations: data,
    isLoadingGetAllStations,
    refetch,
  } = useStationActions(true);
  const [stations, setStations] = useState<StationType[]>(data || []);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showAllReasons, setShowAllReasons] = useState(false);
  const {
    useGetDetailRental,
    rentalDetailData,
    isGetDetailRentalFetching,
    isGetDetailRentalError,
  } = useRentalsActions(true, bookingId, undefined, () =>
    setShowRatingModal(true)
  );
  useEffect(() => {
    useGetDetailRental();
    getMyWallet();
  }, [bookingId]);
  useEffect(() => {
    refetch();
    setStations(data);
  }, [data]);

  useEffect(() => {
    if (rentalDetailData?.data?.result) {
      console.log(
        "Rental Detail:",
        JSON.stringify(rentalDetailData.data.result, null, 2)
      );
    }
  }, [rentalDetailData]);
  const rentalResult = rentalDetailData?.data?.result as
    | RentalDetail
    | undefined;
  const endTimeDate = useMemo(() => {
    if (!rentalResult?.end_time) return null;
    const parsed = new Date(rentalResult.end_time);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [rentalResult?.end_time]);
  const RATING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const isWithinRatingWindow = useMemo(() => {
    if (!endTimeDate) return false;
    const nowTime = Date.now();
    const endTime = endTimeDate.getTime();
    if (Number.isNaN(endTime) || nowTime < endTime) return false;
    return nowTime - endTime <= RATING_WINDOW_MS;
  }, [endTimeDate]);
  const ratingWindowExpired = useMemo(() => {
    if (!endTimeDate) return false;
    const nowTime = Date.now();
    const endTime = endTimeDate.getTime();
    if (Number.isNaN(endTime)) return false;
    return nowTime > endTime + RATING_WINDOW_MS;
  }, [endTimeDate]);
  const canOpenRatingForm =
    Boolean(rentalResult) &&
    rentalResult!.status === "HOÀN THÀNH" &&
    !hasRated &&
    !ratingWindowExpired;

  const {
    ratingReasons,
    isRatingReasonsLoading,
    submitRating,
    isSubmittingRating,
    refetchRatingReasons,
  } = useRatingActions({
    enabled: showRatingForm && Boolean(rentalResult),
  });

  const { data: existingRating } = useGetRatingQuery(
    bookingId,
    Boolean(rentalResult)
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
    if (!rentalResult?._id) {
      setRatingError("Không tìm thấy mã thuê xe để đánh giá.");
      return;
    }
    if (!ratingValue) {
      setRatingError("Vui lòng chọn số sao.");
      return;
    }
    submitRating(
      rentalResult._id,
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
    rentalResult?._id,
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

  const isInitialLoading = isGetDetailRentalFetching || isLoadingGetAllStations;

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <BookingDetailHeader
          title="Chi tiết thuê xe"
          onBackPress={() => navigation.goBack()}
        />
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isGetDetailRentalError || !rentalResult) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <BookingDetailHeader
          title="Chi tiết thuê xe"
          onBackPress={() => navigation.goBack()}
        />
        <ErrorState onRetry={useGetDetailRental} />
      </SafeAreaView>
    );
  }

  const booking = rentalResult as RentalDetail;
  const rentalQrValue = booking?._id || bookingId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <BookingDetailHeader
        title="Chi tiết thuê xe"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <StatusCard status={booking.status} />
        <BikeInfoCard booking={booking} />
        <TimeInfoCard booking={booking} />
        <PaymentInfoCard booking={booking} />
        <BookingIdCard booking={booking} />
        <UserInfoCard booking={booking} />
        <RatingSection
          booking={booking}
          hasRated={hasRated}
          existingRating={existingRating}
          canOpenRatingForm={canOpenRatingForm}
          ratingWindowExpired={ratingWindowExpired}
          showRatingForm={showRatingForm}
          ratingValue={ratingValue}
          selectedReasons={selectedReasons}
          ratingComment={ratingComment}
          ratingError={ratingError}
          showAllReasons={showAllReasons}
          ratingReasons={ratingReasons}
          isRatingReasonsLoading={isRatingReasonsLoading}
          isSubmittingRating={isSubmittingRating}
          displayReasons={displayReasons}
          filteredReasons={filteredReasons}
          setRatingValue={setRatingValue}
          setRatingError={setRatingError}
          setShowAllReasons={setShowAllReasons}
          handleToggleReason={handleToggleReason}
          setRatingComment={setRatingComment}
          handleCancelRating={handleCancelRating}
          handleSubmitRating={handleSubmitRating}
          handleOpenRatingForm={handleOpenRatingForm}
          getAppliesTo={getAppliesTo}
        />
        <ActionButtons booking={booking} rentalQrValue={rentalQrValue} />
      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        rentalId={bookingId}
        onRated={() => setHasRated(true)}
      />
    </View>
  );
}

export default BookingHistoryDetail;
