import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { spaceScale } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { Screen } from "@ui/primitives/screen";
import { getBikeChipDisplay } from "@utils/bike";
import { useCallback } from "react";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";

import type {
  BookingHistoryDetailNavigationProp,
  BookingHistoryDetailRouteProp,
} from "@/types/navigation";

import DetailErrorState from "./components/detail-error-state";
import DetailLoadingState from "./components/detail-loading-state";
import { IncidentTypeSheet } from "./components/incident-type-sheet";
import { RentalActionBar } from "./components/rental-action-bar";
import { RentalHeroCard } from "./components/rental-hero-card";
import { RentalIdPill } from "./components/rental-id-pill";
import { RentalIncidentCard } from "./components/rental-incident-card";
import { RentalJourneyCard } from "./components/rental-journey-card";
import { RentalMetaCard } from "./components/rental-meta-card";
import { useBookingBikeSwapState } from "./hooks/use-booking-bike-swap-state";
import { useBookingIncidentState } from "./hooks/use-booking-incident-state";
import { useRentalDetailData } from "./hooks/use-rental-detail-data";
import { useRentalStatusWatcher } from "./hooks/use-rental-status-watcher";

function BookingHistoryDetailScreen() {
  const navigation = useNavigation<BookingHistoryDetailNavigationProp>();
  const route = useRoute<BookingHistoryDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { bookingId } = route.params;
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
    booking,
    hasToken,
    refetchDetail,
  });

  const {
    bikeSwapPreview,
    bikeSwapRequest,
    bikeSwapRequestQuery,
    bikeSwapStatus,
    confirmedBikeLabel,
    isBikeSwapPending,
  } = useBookingBikeSwapState({
    bookingId,
    booking,
    detail,
  });

  const {
    handleCloseIncidentSheet,
    handleOpenIncidentSheet,
    handleSelectIncidentType,
    hasActiveIncident,
    isIncidentSheetOpen,
    isOngoing,
    isReportingIncident,
    rentalIncident,
    rentalIncidentQuery,
  } = useBookingIncidentState({
    bookingId,
    booking,
  });

  const hasReplacementBike = Boolean(
    booking
    && detail?.bike
    && rentalIncident
    && booking.bikeId !== rentalIncident.bike.id,
  );

  const actionBarHeight = isOngoing ? 188 + Math.max(insets.bottom, spaceScale[4]) : spaceScale[9];
  const isScreenRefreshing = isRefreshing || rentalIncidentQuery.isRefetching || bikeSwapRequestQuery.isRefetching;

  const handleChooseReturnStation = useCallback(() => {
    if (!detail) {
      return;
    }

    navigation.navigate("Trạm", {
      selectionMode: "rental-return-slot",
      rentalId: detail.rental.id,
      currentReturnStationId: detail.returnSlot?.stationId,
    });
  }, [detail, navigation]);

  const handleRequestBikeSwap = useCallback(() => {
    if (!detail) {
      return;
    }

    navigation.navigate("Trạm", {
      selectionMode: "rental-bike-swap",
      rentalId: detail.rental.id,
      currentBikeSwapStationId: isBikeSwapPending ? bikeSwapPreview?.stationId : undefined,
    });
  }, [bikeSwapPreview?.stationId, detail, isBikeSwapPending, navigation]);

  const handleOpenReturnQr = useCallback(() => {
    navigation.navigate("RentalQr", { bookingId });
  }, [bookingId, navigation]);

  const handleRefreshScreen = useCallback(async () => {
    await Promise.all([
      onRefresh(),
      rentalIncidentQuery.refetch(),
      bikeSwapRequestQuery.refetch(),
    ]);
  }, [bikeSwapRequestQuery, onRefresh, rentalIncidentQuery]);

  if (isInitialLoading && !detail) {
    return (
      <Screen>
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        <AppHeroHeader onBack={() => navigation.goBack()} size="compact" title="Chi tiết thuê xe" />
        <DetailLoadingState />
      </Screen>
    );
  }

  if (isError || !detail || !booking) {
    return (
      <Screen>
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        <AppHeroHeader onBack={() => navigation.goBack()} size="compact" title="Chi tiết thuê xe" />
        <DetailErrorState onRetry={refetchDetail} />
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: actionBarHeight,
        }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isScreenRefreshing} onRefresh={handleRefreshScreen} />}
        showsVerticalScrollIndicator={false}
      >
        <YStack>
          <AppHeroHeader
            onBack={() => navigation.goBack()}
            size="compact"
            title="Chi tiết thuê xe"
          />

          <YStack gap="$5" marginTop={-spaceScale[5]} paddingHorizontal="$5">
            <RentalHeroCard rental={booking} />
            {isOngoing && rentalIncident
              ? (
                  <RentalIncidentCard
                    currentBikeLabel={detail.bike ? getBikeChipDisplay(detail.bike) : undefined}
                    hasReplacementBike={hasReplacementBike}
                    incident={rentalIncident}
                    isSubmitting={isReportingIncident}
                    onReportPress={handleOpenIncidentSheet}
                  />
                )
              : null}
            <RentalJourneyCard
              bikeSwapRejectionReason={bikeSwapRequest?.reason ?? null}
              bikeSwapStatus={bikeSwapStatus}
              confirmedBikeLabel={confirmedBikeLabel}
              detail={detail}
              isRequestBikeSwapDisabled={isBikeSwapPending}
              isReportIncidentDisabled={isReportingIncident}
              isReportingIncident={isReportingIncident}
              onRequestBikeSwap={handleRequestBikeSwap}
              onReportIncident={handleOpenIncidentSheet}
              showBikeSwapSection={!hasActiveIncident}
              showIncidentActionSection={!rentalIncident}
            />
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

      <IncidentTypeSheet
        bottomInset={insets.bottom}
        isSubmitting={isReportingIncident}
        onClose={handleCloseIncidentSheet}
        onSelect={handleSelectIncidentType}
        visible={isIncidentSheetOpen}
      />
    </Screen>
  );
}

export default BookingHistoryDetailScreen;
