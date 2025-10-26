import { useQuery } from "@tanstack/react-query";

import { reservationService } from "@services/reservationService";

export function useGetPendingReservationsQuery(page: number = 1, limit: number = 10, enabled: boolean = true) {
  return useQuery({
    queryKey: ["reservations", "pending", page, limit],
    enabled,
    queryFn: async ({ queryKey }) => {
      const [, , pageParam, limitParam] = queryKey;
      return reservationService.getMyReservations({
        page: pageParam as number,
        limit: limitParam as number,
      });
    },
  });
}
