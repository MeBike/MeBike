import { BikeColors } from "@constants/BikeColors";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation, useRoute } from "@react-navigation/native";
import React from "react";
import { ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BikeDetailNavigationProp } from "@/types/navigation";

import BookingDetailHeader from "../booking-history-detail/components/BookingDetailHeader";

import { BikeSummaryCard } from "./components/bike-summary-card";
import { FooterActions } from "./components/footer-actions";
import { PaymentMethodCard } from "./components/payment-method-card";
import { ReservationBanner } from "./components/reservation-banner";
import { useBikeDetail } from "./hooks/use-bike-detail";
import { getBikeStatusColor, styles } from "./styles";
import type { BikeDetailRouteParams } from "./types";

export default function BikeDetailScreen() {
  const navigation = useNavigation<BikeDetailNavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthNext();
  const routeParams = route.params as BikeDetailRouteParams;

  const {
    station,
    currentBike,
    isBikeAvailable,
    isFetchingBikeDetail,
    currentReservation,
    paymentMode,
    canUseSubscription,
    walletBalance,
    activeSubscriptions,
    selectedSubscriptionId,
    setSelectedSubscriptionId,
    isBookingNow,
    handleSelectPaymentMode,
    handleReserve,
    handleBookNow,
  } = useBikeDetail({
    routeParams,
    hasToken: isAuthenticated,
    verifyStatus: user?.verify,
    navigation,
  });

  const statusColor = getBikeStatusColor(currentBike.status);
  const isPrimaryDisabled = isBookingNow || !isBikeAvailable;
  const isReserveDisabled = !isBikeAvailable;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BikeColors.primary} />
      <BookingDetailHeader title="Chi tiết xe" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <BikeSummaryCard
          bike={currentBike}
          stationName={station.name}
          statusColor={statusColor}
          isRefreshing={isFetchingBikeDetail}
        />

        {currentReservation && (
          <ReservationBanner reservation={currentReservation} navigation={navigation} />
        )}

        <PaymentMethodCard
          paymentMode={paymentMode}
          canUseSubscription={canUseSubscription}
          walletBalance={walletBalance}
          activeSubscriptions={activeSubscriptions}
          selectedSubscriptionId={selectedSubscriptionId}
          onSelectPaymentMode={handleSelectPaymentMode}
          onSelectSubscription={(id) => setSelectedSubscriptionId(id)}
          navigation={navigation}
        />
      </ScrollView>

      <FooterActions
        bottomInset={insets.bottom}
        isBikeAvailable={isBikeAvailable}
        isPrimaryDisabled={isPrimaryDisabled}
        isReserveDisabled={isReserveDisabled}
        isBookingNow={isBookingNow}
        onBookNow={handleBookNow}
        onReserve={handleReserve}
      />
    </View>
  );
}
