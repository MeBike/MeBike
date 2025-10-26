import { useMutation } from "@tanstack/react-query";
import { reservationService } from "@services/reservationService";

export const useConfirmReservationMutation = () => {
  return useMutation({
    mutationFn: (id: string) => reservationService.confirmReservation(id),
  });
};

