import { useMutation } from "@tanstack/react-query";

import { reservationService } from "@services/reservation.service";

export function useConfirmReservationMutation() {
  return useMutation({
    mutationFn: (id: string) => reservationService.confirmReservation(id),
  });
}
