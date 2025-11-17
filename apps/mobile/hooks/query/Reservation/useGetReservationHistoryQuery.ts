import { reservationService } from "@services/reservation.service";
import { useQuery } from "@tanstack/react-query";

export function useGetReservationHistoryQuery(
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
  version: number = 0,
) {
  return useQuery({
    queryKey: ["reservations", "history", page, limit, version],
    enabled,
    queryFn: async ({ queryKey }) => {
      const [, , pageParam, limitParam] = queryKey;
      return reservationService.getReservationHistory({
        page: pageParam as number,
        limit: limitParam as number,
      });
    },
  });
}
