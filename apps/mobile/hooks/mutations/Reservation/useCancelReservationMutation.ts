import { useMutation } from "@tanstack/react-query";
import {
  CancelReservationPayload,
  reservationService,
} from "@services/reservationService";

type CancelVariables = {
  id: string;
  payload: CancelReservationPayload;
};

export const useCancelReservationMutation = () => {
  return useMutation({
    mutationFn: ({ id, payload }: CancelVariables) =>
      reservationService.cancelReservation(id, payload),
  });
};

