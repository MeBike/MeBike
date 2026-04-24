import type { PaginatedReservations } from "@/types/reservation-types";
import type { ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";
import { useQuery } from "@tanstack/react-query";

import { reservationQueryKeys } from "./reservation-query-keys";

export function useGetPendingReservationsQuery(
  page: number = 1,
  pageSize: number = 10,
  enabled: boolean = true,
  scope?: string | null,
) {
  return useQuery<PaginatedReservations, ReservationError>({
    queryKey: reservationQueryKeys.pending(scope, page, pageSize),
    enabled,
    queryFn: async () => {
      const result = await reservationService.getCurrentReservations({
        page,
        pageSize,
      });
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
