import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyReservation = async ({page,limit} : {page ?: number , limit ?: number}) => {
  try {
    const response = await agencyService.getReservationInMyStation({page,pageSize:limit});
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetReservationInMyStationAgency = ({page,limit} : {page ?: number , limit ?: number}) => {
  return useQuery({
    queryKey: ["data","reservation-in-my-station","agency",page,limit],
    queryFn: () => fetchMyReservation({ page, limit }),
  });
};
