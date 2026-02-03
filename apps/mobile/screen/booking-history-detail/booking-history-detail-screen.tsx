import RatingModal from "@components/RatingModal";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuthNext } from "@providers/auth-provider-next";
import React, { useEffect, useRef } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import type { RentalDetail } from "@/types/RentalTypes";

import ActionButtons from "./components/ActionButtons";
import BikeInfoCard from "./components/BikeInfoCard";
import BookingDetailHeader from "./components/BookingDetailHeader";
import BookingIdCard from "./components/BookingIdCard";
import ErrorState from "./components/ErrorState";
import LoadingState from "./components/LoadingState";
import PaymentInfoCard from "./components/PaymentInfoCard";
import RatingSection from "./components/RatingSection";
import StatusCard from "./components/StatusCard";
import TimeInfoCard from "./components/TimeInfoCard";
import UserInfoCard from "./components/UserInfoCard";
import { useBookingRating } from "./hooks/use-booking-rating";
import { useRentalDetailData } from "./hooks/use-rental-detail-data";
import { useRentalStatusWatcher } from "./hooks/use-rental-status-watcher";

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
  const { isAuthenticated } = useAuthNext();
  const hasToken = isAuthenticated;

  const {
    booking,
    isInitialLoading,
    isError,
    isRefreshing,
    onRefresh,
    refetchDetail,
  } = useRentalDetailData(bookingId, {
    onRentalEnd: () => ratingModal.open(),
  });

  const { ratingModal, ratingState } = useBookingRating({
    bookingId,
    booking: booking as RentalDetail | undefined,
  });

  const previousStatusRef = useRef<string | undefined>(booking?.status);

  useEffect(() => {
    const prevStatus = previousStatusRef.current;
    if (
      booking?.status === "HOÀN THÀNH" &&
      prevStatus !== "HOÀN THÀNH" &&
      ratingState.canOpenRatingForm &&
      !ratingModal.visible
    ) {
      ratingModal.open();
    }
    previousStatusRef.current = booking?.status;
  }, [booking?.status, ratingState.canOpenRatingForm, ratingModal]);

  useRentalStatusWatcher({
    booking: booking as RentalDetail | undefined,
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

  const resolvedBooking = booking as RentalDetail;
  const rentalQrValue = resolvedBooking?._id || bookingId;

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
        <StatusCard status={resolvedBooking.status} />
        <BikeInfoCard booking={resolvedBooking} />
        <TimeInfoCard booking={resolvedBooking} />
        <PaymentInfoCard booking={resolvedBooking} />
        <BookingIdCard booking={resolvedBooking} />
        <UserInfoCard booking={resolvedBooking} />
        <RatingSection
          booking={resolvedBooking}
          hasRated={ratingState.hasRated}
          existingRating={ratingState.existingRating}
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
        <ActionButtons
          booking={resolvedBooking}
          rentalQrValue={rentalQrValue}
        />
      </ScrollView>

      <RatingModal
        visible={ratingModal.visible}
        onClose={ratingModal.close}
        rentalId={bookingId}
        onRated={ratingModal.markRated}
      />
    </View>
  );
}

export default BookingHistoryDetail;
