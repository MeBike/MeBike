import { useQuery } from "@tanstack/react-query";

import type { PaginatedReservations } from "@/types/reservation-types";
import type { ReservationError } from "@services/reservations";

import { reservationService } from "@services/reservations";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export function useGetPendingReservationsQuery(
  page: number = DEFAULT_PAGE,
  pageSize: number = DEFAULT_PAGE_SIZE,
  enabled: boolean = true,
) {
  return useQuery<PaginatedReservations, ReservationError>({
    queryKey: ["reservations", "pending", page, pageSize],
    enabled,
    queryFn: async ({ queryKey }) => {
      const [, , pageParam, pageSizeParam] = queryKey;
      const result = await reservationService.getMyReservations({
        page: pageParam as number,
        pageSize: pageSizeParam as number,
        status: "PENDING",
      });

      if (!result.ok) {
        throw result.error;
      }

      return result.value;
    },
  });
}
