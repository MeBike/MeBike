import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@/services/reservation.service";
import { QUERY_KEYS } from "@constants/queryKey";
const fetchReservationStats = async () => {
  try {
    const response = await reservationService.getReservationStats();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
  }
};
export const useGetReservationStatsQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.RESERVATION.RESERVATION_STATS,
    queryFn: fetchReservationStats,
  });
};
