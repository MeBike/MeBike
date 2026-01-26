import React from "react";
import { ScrollView, StatusBar, View } from "react-native";

import BookingDetailHeader from "../booking-history-detail/components/BookingDetailHeader";
import { BikeSummaryCard } from "./components/bike-summary-card";
import { FooterActions } from "./components/footer-actions";
import { PaymentMethodCard } from "./components/payment-method-card";
import { ReservationBanner } from "./components/reservation-banner";
import { useBikeDetail } from "./hooks/use-bike-detail";
import { styles } from "./styles";

export default function BikeDetailScreen() {
  const {
    activeSubscriptions,
    canUseSubscription,
    currentBike,
    currentReservation,
    handleBookNow,
    handleReserve,
    handleSelectPaymentMode,
    insets,
    isFetchingBikeDetail,
    isBikeAvailable,
    isPostRentLoading,
    isPrimaryDisabled,
    isReserveDisabled,
    navigation,
    paymentMode,
    remainingById,
    selectedSubscriptionId,
    setSelectedSubscriptionId,
    statusColor,
    station,
    walletBalance,
  } = useBikeDetail();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <BookingDetailHeader
        title="Chi tiết xe"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <BikeSummaryCard
          currentBike={currentBike}
          stationName={station.name}
          statusColor={statusColor}
          isFetching={isFetchingBikeDetail}
        />

        {currentReservation
          ? (
              <ReservationBanner
                reservation={currentReservation}
                onViewDetail={() =>
                  navigation.navigate("ReservationDetail", {
                    reservationId: currentReservation._id,
                    reservation: currentReservation,
                  })}
              />
            )
          : null}

        <PaymentMethodCard
          paymentMode={paymentMode}
          canUseSubscription={canUseSubscription}
          walletBalance={walletBalance}
          activeSubscriptions={activeSubscriptions}
          selectedSubscriptionId={selectedSubscriptionId}
          remainingById={remainingById}
          onSelectPaymentMode={handleSelectPaymentMode}
          onSelectSubscription={setSelectedSubscriptionId}
          onNavigateSubscriptions={() => navigation.navigate("Subscriptions")}
        />
      </ScrollView>
      <FooterActions
        isBikeAvailable={isBikeAvailable}
        isPrimaryDisabled={isPrimaryDisabled}
        isReserveDisabled={isReserveDisabled}
        isPostRentLoading={isPostRentLoading}
        onBookNow={handleBookNow}
        onReserve={handleReserve}
        bottomInset={insets.bottom}
      />
    </View>
  );
}
