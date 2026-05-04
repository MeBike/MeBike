import { useAuthNext } from "@providers/auth-provider-next";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { spaceScale } from "@theme/metrics";
import { getBikeDisplayLabel } from "@utils/bike";
import { useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BookingHistoryDetailNavigationProp } from "@/types/navigation";

import { useReturnSlotExpiredEvents } from "@/hooks/use-return-slot-events";

import { useBookingBikeSwapState } from "./use-booking-bike-swap-state";
import { useBookingIncidentState } from "./use-booking-incident-state";
import { useBookingRating } from "./use-booking-rating";
import { useRentalDetailData } from "./use-rental-detail-data";
import { useRentalStatusWatcher } from "./use-rental-status-watcher";

export function useBookingHistoryDetailScreen(bookingId: string) {
  const navigation = useNavigation<BookingHistoryDetailNavigationProp>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthNext();
  const alertedReturnSlotRef = useRef<string | null>(null);

  const hasToken = isAuthenticated;

  const rental = useRentalDetailData(bookingId, {
    onRentalEnd: undefined,
  });

  useRentalStatusWatcher({
    booking: rental.booking,
    hasToken,
    refetchDetail: rental.refetchDetail,
  });

  const alertReturnSlotExpired = useCallback(() => {
    Alert.alert(
      "Chỗ trả xe đã hết hạn",
      "Bạn cần giữ chỗ lại nếu muốn đảm bảo còn chỗ tại trạm trả xe.",
    );
  }, []);

  const handleReturnSlotExpired = useCallback(() => {
    if (!isFocused) {
      return;
    }

    const returnSlotId = rental.detail?.returnSlot?.id;
    if (returnSlotId && alertedReturnSlotRef.current === returnSlotId) {
      return;
    }

    alertedReturnSlotRef.current = returnSlotId ?? bookingId;
    alertReturnSlotExpired();
    void rental.refetchDetail();
  }, [alertReturnSlotExpired, bookingId, isFocused, rental]);

  useReturnSlotExpiredEvents(
    (payload) => {
      if (payload.rentalId !== bookingId) {
        return;
      }
      handleReturnSlotExpired();
    },
    { enabled: hasToken },
  );

  const bikeSwap = useBookingBikeSwapState({
    bookingId,
    booking: rental.booking,
    detail: rental.detail,
    enabled: isFocused,
  });

  const incident = useBookingIncidentState({
    bookingId,
    booking: rental.booking,
  });

  const rating = useBookingRating({
    bookingId,
    booking: rental.booking,
  });

  const hasReplacementBike = Boolean(
    rental.booking
    && rental.detail?.bike
    && incident.rentalIncident
    && rental.booking.bikeId !== incident.rentalIncident.bike.id,
  );

  const handleChooseReturnStation = useCallback(() => {
    if (!rental.detail) {
      return;
    }

    navigation.navigate("StationSelectFlow", {
      selectionMode: "rental-return-slot",
      rentalId: rental.detail.rental.id,
      currentReturnStationId: rental.detail.returnSlot?.stationId,
    });
  }, [navigation, rental.detail]);

  const handleRequestBikeSwap = useCallback(() => {
    if (!rental.detail) {
      return;
    }

    navigation.navigate("StationSelectFlow", {
      selectionMode: "rental-bike-swap",
      rentalId: rental.detail.rental.id,
      currentBikeSwapStationId: bikeSwap.isBikeSwapPending
        ? (bikeSwap.bikeSwapRequest?.station?.id ?? bikeSwap.bikeSwapPreview?.stationId)
        : undefined,
    });
  }, [
    bikeSwap.bikeSwapPreview?.stationId,
    bikeSwap.bikeSwapRequest?.station?.id,
    bikeSwap.isBikeSwapPending,
    navigation,
    rental.detail,
  ]);

  const handleOpenReturnQr = useCallback(() => {
    navigation.navigate("RentalQr", { bookingId });
  }, [bookingId, navigation]);

  const handleRefreshScreen = useCallback(async () => {
    await Promise.all([
      rental.onRefresh(),
      incident.isOngoing ? incident.rentalIncidentQuery.refetch() : Promise.resolve(),
      incident.isOngoing ? bikeSwap.bikeSwapRequestQuery.refetch() : Promise.resolve(),
      rental.booking?.status === "COMPLETED" ? rating.refresh() : Promise.resolve(),
    ]);
  }, [bikeSwap.bikeSwapRequestQuery, incident.isOngoing, incident.rentalIncidentQuery, rating, rental]);

  const actionBarHeight = incident.isOngoing
    ? 188 + Math.max(insets.bottom, spaceScale[4])
    : spaceScale[9];

  const isScreenRefreshing
    = rental.isRefreshing
      || rental.billing.isRefetching
      || incident.rentalIncidentQuery.isRefetching
      || bikeSwap.bikeSwapRequestQuery.isRefetching
      || rating.isRefreshing;

  const billing = rental.booking?.status === "RENTED" && rental.billing.preview
    ? {
        data: rental.billing.preview,
        mode: "preview" as const,
        totalAmount: rental.billing.preview.totalPayableAmount,
      }
    : rental.booking?.status === "COMPLETED" && rental.billing.detail
      ? {
          data: rental.billing.detail,
          mode: "detail" as const,
          totalAmount: rental.billing.detail.totalAmount,
        }
      : null;

  return {
    booking: rental.booking,
    detail: rental.detail,
    isInitialLoading: rental.isInitialLoading,
    isError: rental.isError,
    isOngoing: incident.isOngoing,
    layout: {
      actionBarHeight,
      bottomInset: insets.bottom,
    },
    refresh: {
      isRefreshing: isScreenRefreshing,
      onRefresh: handleRefreshScreen,
    },
    bikeSwap: {
      ...bikeSwap,
      hasReplacementBike,
      confirmedBikeDisplay: bikeSwap.confirmedBikeLabel,
    },
    incident,
    rating,
    billing: {
      ...rental.billing,
      current: billing,
    },
    actions: {
      handleChooseReturnStation,
      handleOpenReturnQr,
      handleRequestBikeSwap,
    },
    derived: {
      currentBikeLabel: rental.detail?.bike ? getBikeDisplayLabel(rental.detail.bike) : undefined,
    },
  };
}
