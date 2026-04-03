import { useMyBikeSwapPreview } from "@hooks/rentals/use-my-bike-swap-preview";
import { log } from "@lib/log";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { spaceScale } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { Screen } from "@ui/primitives/screen";
import { getBikeChipDisplay } from "@utils/bike";
import * as Location from "expo-location";
import { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";

import type { Rental } from "@/types/rental-types";

import { useCreateIncidentMutation } from "../incidents/hooks/use-create-incident-mutation";
import { useRentalIncidentQuery } from "../incidents/hooks/use-rental-incident-query";
import { isIncidentTerminalStatus, presentIncidentError } from "../incidents/incident-presenters";
import DetailErrorState from "./components/detail-error-state";
import DetailLoadingState from "./components/detail-loading-state";
import { IncidentTypeSheet } from "./components/incident-type-sheet";
import { RentalActionBar } from "./components/rental-action-bar";
import { RentalHeroCard } from "./components/rental-hero-card";
import { RentalIdPill } from "./components/rental-id-pill";
import { RentalIncidentCard } from "./components/rental-incident-card";
import { RentalJourneyCard } from "./components/rental-journey-card";
import { RentalMetaCard } from "./components/rental-meta-card";
import { useRentalDetailData } from "./hooks/use-rental-detail-data";
import { useRentalStatusWatcher } from "./hooks/use-rental-status-watcher";

type RouteParams = {
  bookingId: string;
};

async function resolveIncidentCoordinates() {
  const currentPermission = await Location.getForegroundPermissionsAsync();
  log.debug("Incident location permission", {
    canAskAgain: currentPermission.canAskAgain,
    granted: currentPermission.granted,
    status: currentPermission.status,
  });
  const providerStatus = await Location.getProviderStatusAsync();
  log.debug("Incident location provider status", providerStatus);
  const permission = currentPermission.status === "granted"
    ? currentPermission
    : await Location.requestForegroundPermissionsAsync();

  if (currentPermission.status !== "granted") {
    log.debug("Incident location permission request result", {
      canAskAgain: permission.canAskAgain,
      granted: permission.granted,
      status: permission.status,
    });
  }

  if (permission.status !== "granted") {
    log.warn("Incident location denied", {
      canAskAgain: permission.canAskAgain,
      status: permission.status,
    });
    return null;
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  log.debug("Incident location services enabled check", { servicesEnabled });

  if (!servicesEnabled) {
    log.warn("Incident location services disabled");
    return null;
  }

  try {
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: false,
    });

    log.debug("Incident current position success", {
      accuracy: currentLocation.coords.accuracy,
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      mocked: currentLocation.mocked,
      timestamp: currentLocation.timestamp,
    });

    return {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };
  }
  catch (currentPositionError) {
    log.warn("Incident current position failed", currentPositionError);
    return null;
  }
}

function BookingHistoryDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { bookingId } = route.params as RouteParams;
  const { isAuthenticated } = useAuthNext();
  const hasToken = isAuthenticated;
  const { preview: bikeSwapPreview } = useMyBikeSwapPreview(bookingId);
  const [isIncidentSheetOpen, setIncidentSheetOpen] = useState(false);
  const [isSubmittingIncidentReport, setSubmittingIncidentReport] = useState(false);
  const createIncidentMutation = useCreateIncidentMutation();

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
  const rentalIncidentQuery = useRentalIncidentQuery(bookingId, isOngoing);
  const rentalIncident = rentalIncidentQuery.data ?? null;
  const bikeSwapStatus = bikeSwapPreview
    ? booking?.bikeId && booking.bikeId !== bikeSwapPreview.oldBikeId
      ? "CONFIRMED"
      : "PENDING"
    : "NONE";
  const isReportingIncident = isSubmittingIncidentReport || createIncidentMutation.isPending;
  const isBikeSwapPending = bikeSwapStatus === "PENDING";
  const hasActiveIncident = Boolean(rentalIncident && !isIncidentTerminalStatus(rentalIncident.status));
  const hasReplacementBike = useMemo(() => {
    if (!booking || !detail?.bike || !rentalIncident) {
      return false;
    }

    return booking.bikeId !== rentalIncident.bike.id;
  }, [booking, detail?.bike, rentalIncident]);
  const actionBarHeight = isOngoing ? 188 + Math.max(insets.bottom, spaceScale[4]) : spaceScale[9];
  const isScreenRefreshing = isRefreshing || rentalIncidentQuery.isRefetching;

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

  const handleOpenIncidentSheet = useCallback(() => {
    setIncidentSheetOpen(true);
  }, []);

  const handleRequestBikeSwap = useCallback(() => {
    if (!detail) {
      return;
    }

    (navigation as any).navigate("Trạm", {
      selectionMode: "rental-bike-swap",
      rentalId: detail.rental.id,
      currentBikeSwapStationId: isBikeSwapPending ? bikeSwapPreview?.stationId : undefined,
    });
  }, [bikeSwapPreview?.stationId, detail, isBikeSwapPending, navigation]);

  const handleCloseIncidentSheet = useCallback(() => {
    if (isReportingIncident) {
      return;
    }

    setIncidentSheetOpen(false);
  }, [isReportingIncident]);

  const handleSelectIncidentType = useCallback(async (incidentType: string) => {
    if (!booking || isReportingIncident) {
      return;
    }

    setSubmittingIncidentReport(true);

    try {
      const coordinates = await resolveIncidentCoordinates();

      if (!coordinates) {
        Alert.alert(
          "Không thể báo cáo sự cố",
          "Vui lòng bật dịch vụ vị trí và cấp quyền vị trí để gửi yêu cầu hỗ trợ.",
        );
        return;
      }

      await createIncidentMutation.mutateAsync({
        rentalId: booking.id,
        bikeId: booking.bikeId,
        incidentType,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      setIncidentSheetOpen(false);
    }
    catch (error) {
      Alert.alert("Không thể báo cáo sự cố", presentIncidentError(error as Parameters<typeof presentIncidentError>[0]));
    }
    finally {
      setSubmittingIncidentReport(false);
    }
  }, [booking, createIncidentMutation, isReportingIncident]);

  const handleOpenReturnQr = useCallback(() => {
    (navigation as any).navigate("RentalQr", { bookingId });
  }, [bookingId, navigation]);

  const handleRefreshScreen = useCallback(async () => {
    await Promise.all([
      onRefresh(),
      rentalIncidentQuery.refetch(),
    ]);
  }, [onRefresh, rentalIncidentQuery]);

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
              bikeSwapStatus={bikeSwapStatus}
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
