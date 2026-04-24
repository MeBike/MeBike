import type { PaginatedReservations } from "@/types/reservation-types";
import type { ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";
import { useQuery } from "@tanstack/react-query";

import { reservationQueryKeys } from "./reservation-query-keys";

export function useGetReservationHistoryQuery(
  page: number = 1,
  pageSize: number = 10,
  enabled: boolean = true,
  version: number = 0,
  scope?: string | null,
) {
  return useQuery<PaginatedReservations, ReservationError>({
    queryKey: reservationQueryKeys.history(scope, page, pageSize, version),
    enabled,
    queryFn: async () => {
      const result = await reservationService.getReservationHistory({
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
