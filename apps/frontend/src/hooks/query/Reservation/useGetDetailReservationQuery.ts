import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservation.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const getDetailReservation = async (id: string) => {
  try {
    const response = await reservationService.getDetailReservation(id);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch reservation detail");
  }
};
export const useGetDetailReservationQuery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.RESERVATION.DETAIL_RESERVATION(id),
    queryFn: () => getDetailReservation(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
