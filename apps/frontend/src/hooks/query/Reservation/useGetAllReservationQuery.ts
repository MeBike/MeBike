import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservation.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const fetchAllReservations = async ({page, limit} : {page?: number, limit?: number}) => {
  try {
    const response = await reservationService.getUserReservations({page, limit});
    if(response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch reservations");
  }
};
export const useGetAllReservationQuery = ({page, limit}: {page?: number, limit?: number}) => {
  return useQuery({
    queryKey: QUERY_KEYS.RESERVATION.ALL_RESERVATIONS(page, limit),
    queryFn: () => fetchAllReservations({page, limit}),
    staleTime: 5 * 60 * 1000, 
  });
};