import { useMutation } from "@tanstack/react-query";

import type {
  CancelReservationPayload,
} from "@services/reservation.service";

import {
  reservationService,
} from "@services/reservation.service";

type CancelVariables = {
  id: string;
  payload: CancelReservationPayload;
};

export function useCancelReservationMutation() {
  return useMutation({
    mutationFn: ({ id, payload }: CancelVariables) =>
      reservationService.cancelReservation(id, payload),
  });
}
