import type { Reservation } from "@/types/reservation-types";
import type { ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";
import { useQuery } from "@tanstack/react-query";

import { reservationQueryKeys } from "./reservation-query-keys";

export function useGetReservationDetailQuery(
  reservationId: string,
  enabled: boolean = true,
  scope?: string | null,
) {
  return useQuery<Reservation, ReservationError>({
    queryKey: reservationQueryKeys.detail(scope, reservationId),
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
