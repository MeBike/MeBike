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
  const isValidId = 
    Boolean(id) && 
    id !== "undefined" && 
    id !== "null" && 
    id.trim() !== "";
  return useQuery({
    queryKey: ['ADMIN_RESERVATION_DETAIL', id],
    queryFn: () => getDetailReservation(id),
    staleTime: 5 * 60 * 1000,
    enabled: false,
  });
};
