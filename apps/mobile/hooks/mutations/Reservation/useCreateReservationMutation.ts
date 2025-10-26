import { useMutation } from "@tanstack/react-query";
import {
  CreateReservationPayload,
  reservationService,
} from "@services/reservationService";

export const useCreateReservationMutation = () => {
  return useMutation({
    mutationFn: (payload: CreateReservationPayload) =>
      reservationService.createReservation(payload),
  });
};

