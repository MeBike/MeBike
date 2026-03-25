import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";

import type { ReservationsScreenNavigationProp } from "../types/navigation";
import type { Reservation } from "../types/reservation-types";

export function useReservationNavigation() {
  const navigation = useNavigation<ReservationsScreenNavigationProp>();

  const handleNavigateToDetail = useCallback(
    (reservation: Reservation) => {
      navigation.navigate("ReservationDetail", {
        reservationId: reservation.id,
        reservation,
      });
    },
    [navigation],
  );

  return {
    handleNavigateToDetail,
    canGoBack: () => navigation.canGoBack(),
    goBack: () => navigation.goBack(),
  };
}
