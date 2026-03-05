import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";

import type { ReservationsScreenNavigationProp } from "../types/navigation";
import type { Reservation } from "../types/reservation-types";

export function useReservationNavigation(
  stationMap: Map<string, { name: string; address?: string }>,
) {
  const navigation = useNavigation<ReservationsScreenNavigationProp>();

  const handleNavigateToDetail = useCallback(
    (reservation: Reservation) => {
      const stationEntry = stationMap.get(reservation.stationId);
      const stationInfo = reservation.station ?? (stationEntry
        ? {
            id: reservation.stationId,
            name: stationEntry.name,
            address: stationEntry.address ?? "",
          }
        : undefined);

      navigation.navigate("ReservationDetail", {
        reservationId: reservation.id,
        reservation: {
          ...reservation,
          station: stationInfo,
        },
      });
    },
    [navigation, stationMap],
  );

  return {
    handleNavigateToDetail,
    canGoBack: () => navigation.canGoBack(),
    goBack: () => navigation.goBack(),
  };
}
