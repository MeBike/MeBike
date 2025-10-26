import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservationService";

export const useGetReservationHistoryQuery = (
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["reservations", "history", page, limit],
    enabled,
    queryFn: async ({ queryKey }) => {
      const [, , pageParam, limitParam] = queryKey;
      return reservationService.getReservationHistory({
        page: pageParam as number,
        limit: limitParam as number,
      });
    },
  });
};
