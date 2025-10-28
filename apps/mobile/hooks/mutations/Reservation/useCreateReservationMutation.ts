import { useMutation } from "@tanstack/react-query";

import type {
  CreateReservationPayload,
} from "@services/reservationService";

import {
  reservationService,
} from "@services/reservationService";

export function useCreateReservationMutation() {
  return useMutation({
    mutationFn: (payload: CreateReservationPayload) =>
      reservationService.createReservation(payload),
  });
}
