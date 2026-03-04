import { useGetBikeByIDAllQuery } from "@hooks/query/Bike/use-get-bike-by-id-query";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import type { Rental } from "@/types/rental-types";

import BookingDetailHeader from "./components/BookingDetailHeader";
import ErrorState from "./components/ErrorState";
import LoadingState from "./components/LoadingState";
import RatingSection from "./components/RatingSection";
import { useBookingRating } from "./hooks/use-booking-rating";
import { useRentalDetailData } from "./hooks/use-rental-detail-data";
import { useRentalStatusWatcher } from "./hooks/use-rental-status-watcher";
import { RentalActionButtons } from "./v1/action-buttons";
import { RentalBikeInfoCard } from "./v1/bike-info-card";
import { RentalBookingIdCard } from "./v1/booking-id-card";
import { RentalPaymentInfoCard } from "./v1/payment-info-card";
import { RentalStatusCard } from "./v1/status-card";
import { RentalTimeInfoCard } from "./v1/time-info-card";

type RouteParams = {
  bookingId: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F5F9",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
});

function BookingHistoryDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as RouteParams;
  const { isAuthenticated } = useAuthNext();
  const hasToken = isAuthenticated;

  const {
    booking,
    stations,
    isInitialLoading,
    isError,
    isRefreshing,
    onRefresh,
    refetchDetail,
  } = useRentalDetailData(bookingId, {
    onRentalEnd: undefined,
  });

  const stationsById = useMemo(() => {
    const map = new Map<string, typeof stations[number]>();
    for (const s of stations ?? []) {
      map.set(s._id, s);
    }
    return map;
  }, [stations]);

  const bikeId = booking?.bikeId ?? "";
  const bikeQuery = useGetBikeByIDAllQuery(bikeId);

  const { ratingState } = useBookingRating({
    bookingId,
    booking,
  });

  useRentalStatusWatcher({
    booking: booking as Rental | undefined,
    hasToken,
    refetchDetail,
  });

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

  if (isError || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <BookingDetailHeader
          title="Chi tiết thuê xe"
          onBackPress={() => navigation.goBack()}
        />
        <ErrorState onRetry={refetchDetail} />
      </SafeAreaView>
    );
  }

  const resolvedBooking = booking as Rental;
  const bike = bikeQuery.data;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <BookingDetailHeader
        title="Chi tiết thuê xe"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <RentalStatusCard
          status={resolvedBooking.status}
          startTime={resolvedBooking.startTime}
          duration={resolvedBooking.duration}
          totalPrice={resolvedBooking.totalPrice}
        />
        <RentalTimeInfoCard rental={resolvedBooking} />
        <RentalBikeInfoCard rental={resolvedBooking} stationsById={stationsById} bike={bike} />
        <RentalPaymentInfoCard rental={resolvedBooking} />
        <RentalBookingIdCard rentalId={resolvedBooking.id} />
        <RatingSection
          booking={resolvedBooking}
          hasRated={ratingState.hasRated}
          existingRating={ratingState.existingRating ?? undefined}
          canOpenRatingForm={ratingState.canOpenRatingForm}
          ratingWindowExpired={ratingState.ratingWindowExpired}
          showRatingForm={ratingState.showRatingForm}
          ratingValue={ratingState.ratingValue}
          selectedReasons={ratingState.selectedReasons}
          ratingComment={ratingState.ratingComment}
          ratingError={ratingState.ratingError}
          showAllReasons={ratingState.showAllReasons}
          ratingReasons={ratingState.ratingReasons}
          isRatingReasonsLoading={ratingState.isRatingReasonsLoading}
          isSubmittingRating={ratingState.isSubmittingRating}
          displayReasons={ratingState.displayReasons}
          filteredReasons={ratingState.filteredReasons}
          setRatingValue={ratingState.setRatingValue}
          setRatingError={ratingState.setRatingError}
          setShowAllReasons={ratingState.setShowAllReasons}
          handleToggleReason={ratingState.handleToggleReason}
          setRatingComment={ratingState.setRatingComment}
          handleCancelRating={ratingState.handleCancelRating}
          handleSubmitRating={ratingState.handleSubmitRating}
          handleOpenRatingForm={ratingState.handleOpenRatingForm}
          getAppliesTo={ratingState.getAppliesTo}
        />
        <RentalActionButtons rental={resolvedBooking} />
      </ScrollView>
    </View>
  );
}

export default BookingHistoryDetail;
