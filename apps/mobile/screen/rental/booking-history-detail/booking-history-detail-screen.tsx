import { useNavigation, useRoute } from "@react-navigation/native";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { useTheme, YStack } from "tamagui";

import type {
  BookingHistoryDetailNavigationProp,
  BookingHistoryDetailRouteProp,
} from "@/types/navigation";

import { spaceScale } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { Screen } from "@ui/primitives/screen";

import DetailErrorState from "./components/detail-error-state";
import DetailLoadingState from "./components/detail-loading-state";
import { IncidentTypeSheet } from "./components/incident-type-sheet";
import { RentalActionBar } from "./components/rental-action-bar";
import { RentalHeroCard } from "./components/rental-hero-card";
import { RentalIdPill } from "./components/rental-id-pill";
import { RentalIncidentCard } from "./components/rental-incident-card";
import { RentalJourneyCard } from "./components/rental-journey-card";
import { RentalMetaCard } from "./components/rental-meta-card";
import { RentalRatingCard } from "./components/rental-rating-card";
import { RentalRatingSheet } from "./components/rental-rating-sheet";
import { useBookingHistoryDetailScreen } from "./hooks/use-booking-history-detail-screen";

function BookingHistoryDetailScreen() {
  const navigation = useNavigation<BookingHistoryDetailNavigationProp>();
  const route = useRoute<BookingHistoryDetailRouteProp>();
  const theme = useTheme();
  const { bookingId } = route.params;
  const vm = useBookingHistoryDetailScreen(bookingId);

  if (vm.isInitialLoading && !vm.detail) {
    return (
      <Screen>
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        <AppHeroHeader onBack={() => navigation.goBack()} size="compact" title="Chi tiết thuê xe" />
        <DetailLoadingState />
      </Screen>
    );
  }

  if (vm.isError || !vm.detail || !vm.booking) {
    return (
      <Screen>
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        <AppHeroHeader onBack={() => navigation.goBack()} size="compact" title="Chi tiết thuê xe" />
        <DetailErrorState onRetry={vm.refresh.onRefresh} />
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: vm.layout.actionBarHeight,
        }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={vm.refresh.isRefreshing} onRefresh={vm.refresh.onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <YStack>
          <AppHeroHeader
            onBack={() => navigation.goBack()}
            size="compact"
            title="Chi tiết thuê xe"
          />

          <YStack gap="$5" marginTop={-spaceScale[5]} paddingHorizontal="$5">
            <RentalHeroCard rental={vm.booking} />

            {vm.isOngoing && vm.incident.rentalIncident
              ? (
                  <RentalIncidentCard
                    currentBikeLabel={vm.derived.currentBikeLabel}
                    hasReplacementBike={vm.bikeSwap.hasReplacementBike}
                    incident={vm.incident.rentalIncident}
                    isSubmitting={vm.incident.isReportingIncident}
                    onReportPress={vm.incident.handleOpenIncidentSheet}
                  />
                )
              : null}

            <RentalJourneyCard
              bikeSwapRejectionReason={vm.bikeSwap.bikeSwapRequest?.reason ?? null}
              bikeSwapStatus={vm.bikeSwap.bikeSwapStatus}
              confirmedBikeLabel={vm.bikeSwap.confirmedBikeDisplay}
              detail={vm.detail}
              isRequestBikeSwapDisabled={vm.bikeSwap.isBikeSwapPending}
              isReportIncidentDisabled={vm.incident.isReportingIncident}
              isReportingIncident={vm.incident.isReportingIncident}
              onRequestBikeSwap={vm.actions.handleRequestBikeSwap}
              onReportIncident={vm.incident.handleOpenIncidentSheet}
              showBikeSwapSection={!vm.incident.hasActiveIncident}
              showIncidentActionSection={!vm.incident.rentalIncident}
            />

            <RentalMetaCard detail={vm.detail} />
            <RentalRatingCard state={vm.rating.cardState} />
            <RentalIdPill rentalId={vm.booking.id} />
          </YStack>
        </YStack>
      </ScrollView>

      {vm.isOngoing
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
                bottomInset={vm.layout.bottomInset}
                currentReturnStationId={vm.detail.returnSlot?.stationId}
                onChooseReturnStation={vm.actions.handleChooseReturnStation}
                onOpenReturnQr={vm.actions.handleOpenReturnQr}
                rentalId={vm.booking.id}
                returnStationName={vm.detail.returnStation?.name}
              />
            </View>
          )
        : null}

      <IncidentTypeSheet
        bottomInset={vm.layout.bottomInset}
        isSubmitting={vm.incident.isReportingIncident}
        onClose={vm.incident.handleCloseIncidentSheet}
        onSelect={vm.incident.handleSelectIncidentType}
        visible={vm.incident.isIncidentSheetOpen}
      />

      <RentalRatingSheet {...vm.rating.sheet} />
    </Screen>
  );
}

export default BookingHistoryDetailScreen;
