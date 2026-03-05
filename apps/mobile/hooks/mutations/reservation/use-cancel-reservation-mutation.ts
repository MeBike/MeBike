import { useMutation } from "@tanstack/react-query";

import type { Reservation } from "@/types/reservation-types";
import type { ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";

export function useCancelReservationMutation() {
  return useMutation<Reservation, ReservationError, string>({
    mutationFn: async (reservationId: string) => {
      const result = await reservationService.cancelReservation(reservationId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
