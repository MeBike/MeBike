import { useQuery } from "@tanstack/react-query";

import type { Reservation } from "@/types/reservation-types";
import type { ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";

export function useGetReservationDetailQuery(reservationId: string, enabled = false) {
  return useQuery<Reservation, ReservationError>({
    queryKey: ["reservations", "detail", reservationId],
    enabled: enabled && Boolean(reservationId),
    queryFn: async () => {
      const result = await reservationService.getReservationDetails(reservationId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
