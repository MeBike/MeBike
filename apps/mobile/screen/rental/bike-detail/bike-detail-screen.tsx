import { useNavigation, useRoute } from "@react-navigation/native";
import React from "react";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";

import type { BikeDetailNavigationProp } from "@/types/navigation";

import { useAuthNext } from "@providers/auth-provider-next";
import { spaceScale } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";

import type { BikeDetailRouteParams } from "./types";

import { BikeSummaryCard } from "./components/bike-summary-card";
import { FooterActions } from "./components/footer-actions";
import { PaymentMethodCard } from "./components/payment-method-card";
import { ReservationBanner } from "./components/reservation-banner";
import { useBikeDetail } from "./hooks/use-bike-detail";
import { createBikeDetailTextStyles } from "./text-styles";

export default function BikeDetailScreen() {
  const navigation = useNavigation<BikeDetailNavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const bikeDetailTextStyles = createBikeDetailTextStyles(theme);
  const { user, isAuthenticated } = useAuthNext();
  const routeParams = route.params as BikeDetailRouteParams;

  const {
    station,
    currentBike,
    isBikeAvailable,
    isRefreshing,
    currentReservation,
    paymentMode,
    canUseSubscription,
    walletBalance,
    activeSubscriptions,
    selectedSubscriptionId,
    setSelectedSubscriptionId,
    isBookingNow,
    handleRefresh,
    handleSelectPaymentMode,
    handleReserve,
    handleBookNow,
  } = useBikeDetail({
    routeParams,
    hasToken: isAuthenticated,
    verifyStatus: user?.verify,
    navigation,
  });

  return (
    <Screen>
      <StatusBar barStyle="light-content" backgroundColor={theme.actionPrimary.val} />

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: insets.bottom + 148 }}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.actionPrimary.val]}
            tintColor={theme.actionPrimary.val}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <AppHeroHeader onBack={() => navigation.goBack()} size="default" title="Chi tiết xe" />

        <View
          style={{
            marginTop: -spaceScale[6],
            paddingHorizontal: spaceScale[5],
            zIndex: 10,
          }}
        >
          <BikeSummaryCard bike={currentBike} stationName={station.name} />
        </View>

        <YStack gap="$4" padding="$5" paddingTop="$4">
          {currentReservation
            ? <ReservationBanner reservation={currentReservation} navigation={navigation} />
            : null}

          <YStack gap="$3">
            <AppText style={bikeDetailTextStyles.sectionTitle}>
              Phương thức thanh toán
            </AppText>
            <PaymentMethodCard
              paymentMode={paymentMode}
              canUseSubscription={canUseSubscription}
              walletBalance={walletBalance}
              activeSubscriptions={activeSubscriptions}
              selectedSubscriptionId={selectedSubscriptionId}
              onSelectPaymentMode={handleSelectPaymentMode}
              onSelectSubscription={id => setSelectedSubscriptionId(id)}
              navigation={navigation}
            />
          </YStack>
        </YStack>
      </ScrollView>

      <FooterActions
        bottomInset={insets.bottom}
        isBikeAvailable={isBikeAvailable}
        isPrimaryDisabled={isBookingNow || !isBikeAvailable}
        isReserveDisabled={!isBikeAvailable}
        isBookingNow={isBookingNow}
        onBookNow={handleBookNow}
        onReserve={handleReserve}
      />
    </Screen>
  );
}
