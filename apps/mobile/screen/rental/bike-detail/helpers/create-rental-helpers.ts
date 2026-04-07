import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";
import type { QueryClient } from "@tanstack/react-query";

import { invalidateRentalCreationQueries } from "@hooks/rentals/rental-cache";
import { formatBikeNumber } from "@utils/bike";

import type { BikeSummary } from "@/contracts/server";
import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Subscription } from "@/types/subscription-types";

import type { PaymentMode } from "../types";

type StationInfo = {
  id: string;
  name: string;
  address: string;
};

export function buildBikeLabel(bike: BikeSummary) {
  return formatBikeNumber(bike.bikeNumber, bike.id);
}

export function buildReservationFlowParams(args: {
  currentBike: BikeSummary;
  station: StationInfo;
  paymentMode: PaymentMode;
  activeSubscriptions: Subscription[];
  selectedSubscriptionId: string | null;
}) {
  const reservationMode: ReservationMode = args.paymentMode === "subscription"
    ? "GÓI THÁNG"
    : "MỘT LẦN";

  const initialSubscriptionId = args.paymentMode === "subscription"
    ? args.selectedSubscriptionId ?? args.activeSubscriptions[0]?.id ?? undefined
    : undefined;

  return {
    stationId: args.station.id,
    stationName: args.station.name,
    stationAddress: args.station.address,
    bikeId: args.currentBike.id,
    bikeName: buildBikeLabel(args.currentBike),
    initialMode: reservationMode,
    initialSubscriptionId,
    lockPaymentSelection: true,
  };
}

export function buildCreateRentalPayload(args: {
  currentBike: BikeSummary;
  station: StationInfo;
  paymentMode: PaymentMode;
  selectedSubscriptionId: string | null;
}) {
  if (args.paymentMode === "subscription") {
    return args.selectedSubscriptionId
      ? {
          bikeId: args.currentBike.id,
          startStationId: args.station.id,
          subscriptionId: args.selectedSubscriptionId,
        }
      : null;
  }

  return {
    bikeId: args.currentBike.id,
    startStationId: args.station.id,
  };
}

export function invalidateRentalRelatedQueries(queryClient: QueryClient) {
  void invalidateRentalCreationQueries(queryClient, { includeSubscriptions: true });
}

export function navigateToReservationFlow(
  navigation: BikeDetailNavigationProp,
  params: ReturnType<typeof buildReservationFlowParams>,
) {
  navigation.navigate("ReservationFlow", params);
}
