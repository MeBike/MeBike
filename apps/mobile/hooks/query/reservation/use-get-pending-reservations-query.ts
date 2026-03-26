import type { PaginatedReservations } from "@/types/reservation-types";
import type { ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";
import { useQuery } from "@tanstack/react-query";

export function useGetPendingReservationsQuery(
  page: number = 1,
  pageSize: number = 10,
  enabled: boolean = true,
) {
  return useQuery<PaginatedReservations, ReservationError>({
    queryKey: ["reservations", "pending", page, pageSize],
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
