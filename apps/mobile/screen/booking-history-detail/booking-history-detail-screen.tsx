import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { Screen } from "@ui/primitives/screen";
import { useCallback } from "react";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import type { Rental } from "@/types/rental-types";

import DetailErrorState from "./components/detail-error-state";
import DetailLoadingState from "./components/detail-loading-state";
import { RentalActionBar } from "./components/rental-action-bar";
import { RentalHeroCard } from "./components/rental-hero-card";
import { RentalIdPill } from "./components/rental-id-pill";
import { RentalJourneyCard } from "./components/rental-journey-card";
import { RentalMetaCard } from "./components/rental-meta-card";
import { useRentalDetailData } from "./hooks/use-rental-detail-data";
import { useRentalStatusWatcher } from "./hooks/use-rental-status-watcher";

type RouteParams = {
  bookingId: string;
};

function BookingHistoryDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { bookingId } = route.params as RouteParams;
  const { isAuthenticated } = useAuthNext();
  const hasToken = isAuthenticated;

  const {
    detail,
    booking,
    isInitialLoading,
    isError,
    isRefreshing,
    onRefresh,
    refetchDetail,
  } = useRentalDetailData(bookingId, {
    onRentalEnd: undefined,
  });

  useRentalStatusWatcher({
    booking: booking as Rental | undefined,
    hasToken,
    refetchDetail,
  });

  const isOngoing = booking?.status === "RENTED";
  const actionBarHeight = isOngoing ? 164 + Math.max(insets.bottom, spacing.lg) : spacing.xxxxl;

  const handleChooseReturnStation = useCallback(() => {
    if (!detail) {
      return;
    }

    (navigation as any).navigate("Trạm", {
      selectionMode: "rental-return-slot",
      rentalId: detail.rental.id,
      currentReturnStationId: detail.returnSlot?.stationId,
    });
  }, [detail, navigation]);

  const handleOpenReturnQr = useCallback(() => {
    (navigation as any).navigate("RentalQr", { bookingId });
  }, [bookingId, navigation]);

  if (isInitialLoading && !detail) {
    return (
      <Screen>
        <StatusBar backgroundColor={colors.brandPrimary} barStyle="light-content" />
        <AppHeroHeader onBack={() => navigation.goBack()} size="compact" title="Chi tiết thuê xe" />
        <DetailLoadingState />
      </Screen>
    );
  }

  if (isError || !detail || !booking) {
    return (
      <Screen>
        <StatusBar backgroundColor={colors.brandPrimary} barStyle="light-content" />
        <AppHeroHeader onBack={() => navigation.goBack()} size="compact" title="Chi tiết thuê xe" />
        <DetailErrorState onRetry={refetchDetail} />
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar backgroundColor={colors.brandPrimary} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: actionBarHeight,
        }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <YStack>
          <AppHeroHeader
            onBack={() => navigation.goBack()}
            size="compact"
            title="Chi tiết thuê xe"
          />

          <YStack gap="$5" marginTop={-spacing.xl} paddingHorizontal="$5">
            <RentalHeroCard rental={booking} />
            <RentalJourneyCard detail={detail} />
            <RentalMetaCard detail={detail} />
            <RentalIdPill rentalId={booking.id} />
          </YStack>
        </YStack>
      </ScrollView>

      {isOngoing
        ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <RentalActionBar
                bottomInset={insets.bottom}
                currentReturnStationId={detail.returnSlot?.stationId}
                onChooseReturnStation={handleChooseReturnStation}
                onOpenReturnQr={handleOpenReturnQr}
                rentalId={booking.id}
                returnStationName={detail.returnStation?.name}
              />
            </View>
          )
        : null}
    </Screen>
  );
}

export default BookingHistoryDetailScreen;
