import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyReservation = async ({page,pageSize} : {page ?: number , pageSize ?: number}) => {
  try {
    const response = await agencyService.getReservationInMyStation({page,pageSize});
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetReservationInMyStationAgency = ({page,pageSize} : {page ?: number , pageSize ?: number}) => {
  return useQuery({
    queryKey: ["data","reservation-in-my-station","agency",page,pageSize],
    queryFn: () => fetchMyReservation({ page, pageSize }),
  });
};
