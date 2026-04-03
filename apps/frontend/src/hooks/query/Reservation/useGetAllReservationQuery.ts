import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservation.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const fetchAllReservations = async ({page, pageSize} : {page?: number, pageSize?: number}) => {
  try {
    const response = await reservationService.getUserReservations({page:page, pageSize:pageSize});
    if(response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch reservations");
  }
};
export const useGetAllReservationQuery = ({page, pageSize}: {page?: number, pageSize?: number}) => {
  return useQuery({
    queryKey: QUERY_KEYS.RESERVATION.ALL_RESERVATIONS(page, pageSize),
    queryFn: () => fetchAllReservations({page:page, pageSize:pageSize}),
    staleTime: 5 * 60 * 1000, 
  });
};