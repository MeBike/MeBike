import type { ConfirmReservationResult, ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";
import { useMutation } from "@tanstack/react-query";

export function useConfirmReservationMutation() {
  return useMutation<ConfirmReservationResult, ReservationError, string>({
    mutationFn: async (reservationId: string) => {
      const result = await reservationService.confirmReservation(reservationId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
