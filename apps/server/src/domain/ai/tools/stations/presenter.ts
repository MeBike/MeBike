import { requiredAvailableBikesForNextReservation, stationCanAcceptReservation } from "@/domain/reservations/services/reservation-availability-rule";
import { toContractNearbyStation, toContractStationReadSummary } from "@/http/presenters/stations.presenter";

export function toStationAiDetail(station: Parameters<typeof toContractStationReadSummary>[0]) {
  return {
    ...toContractStationReadSummary(station),
    reservationPolicy: {
      canAcceptNewReservation: stationCanAcceptReservation({
        availableBikes: station.availableBikes,
        pendingReservations: station.reservedBikes,
      }),
      requiredAvailableBikes: requiredAvailableBikesForNextReservation(station.reservedBikes),
    },
  };
}

export function toNearbyStationAiDetail(station: Parameters<typeof toContractNearbyStation>[0]) {
  return {
    ...toContractNearbyStation(station),
    reservationPolicy: {
      canAcceptNewReservation: stationCanAcceptReservation({
        availableBikes: station.availableBikes,
        pendingReservations: station.reservedBikes,
      }),
      requiredAvailableBikes: requiredAvailableBikesForNextReservation(station.reservedBikes),
    },
  };
}
