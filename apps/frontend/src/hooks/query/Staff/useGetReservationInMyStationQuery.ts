import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@/services/reservation.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyReservation = async ({page,limit} : {page ?: number , limit ?: number}) => {
  try {
    const response = await reservationService.getReservationInMyStation({page,pageSize:limit});
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetReservationInMyStation = ({page,limit} : {page ?: number , limit ?: number}) => {
  return useQuery({
    queryKey: ["data","reservation-in-my-station",page,limit],
    queryFn: () => fetchMyReservation({ page, limit }),
  });
};
