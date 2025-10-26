import { useMutation } from "@tanstack/react-query";

import type {
  CancelReservationPayload,
} from "@services/reservationService";

import {
  reservationService,
} from "@services/reservationService";

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
