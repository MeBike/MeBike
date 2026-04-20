import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyRentalDetail = async ({id} : {id:string}) => {
  try {
    const response = await agencyService.getRentalDetailInMyStation(id);
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetRentalDetailAgencyInMyStation = ({id} : {id:string}) => {
  return useQuery({
    queryKey: ["data","rental-detail-in-my-station","agency",id],
    queryFn: () => fetchMyRentalDetail({ id }),
  });
};
