import type { CreateReservationPayload, ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";
import { useMutation } from "@tanstack/react-query";

import type { Reservation } from "@/types/reservation-types";

export function useCreateReservationMutation() {
  return useMutation<Reservation, ReservationError, CreateReservationPayload>({
    mutationFn: async (payload) => {
      const result = await reservationService.createReservation(payload);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
