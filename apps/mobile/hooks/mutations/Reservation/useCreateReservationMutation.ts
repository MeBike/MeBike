import { useMutation } from "@tanstack/react-query";

import type {
  CreateReservationPayload,
} from "@services/reservation.service";

import {
  reservationService,
} from "@services/reservation.service";

export function useCreateReservationMutation() {
  return useMutation({
    mutationFn: (payload: CreateReservationPayload) =>
      reservationService.createReservation(payload),
  });
}
