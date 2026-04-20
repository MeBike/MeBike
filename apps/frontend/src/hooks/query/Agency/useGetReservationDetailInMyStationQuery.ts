import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyReservationDetail = async ({id} : {id:string}) => {
  try {
    const response = await agencyService.getReservationDetailInMyStation(id);
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetReservationDetailInMyStation = ({id} : {id:string}) => {
  return useQuery({
    queryKey: ["data","reservation-detail-in-my-station","agency",id],
    queryFn: () => fetchMyReservationDetail({ id }),
  });
};
