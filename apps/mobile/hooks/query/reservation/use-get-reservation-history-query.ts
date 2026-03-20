import type { PaginatedReservations } from "@/types/reservation-types";
import type { ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";
import { useQuery } from "@tanstack/react-query";

export function useGetReservationHistoryQuery(
  page: number = 1,
  pageSize: number = 10,
  enabled: boolean = true,
  version: number = 0,
) {
  return useQuery<PaginatedReservations, ReservationError>({
    queryKey: ["reservations", "history", page, pageSize, version],
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
