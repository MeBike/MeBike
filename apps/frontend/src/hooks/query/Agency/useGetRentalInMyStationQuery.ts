import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyRental = async ({page,limit} : {page ?: number , limit ?: number}) => {
  try {
    const response = await agencyService.getRentalInMyStation({page,pageSize:limit});
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetRentalInMyStationAgency = ({page,limit} : {page ?: number , limit ?: number}) => {
  return useQuery({
    queryKey: ["data","rental-in-my-station","agency",page,limit],
    queryFn: () => fetchMyRental({ page, limit }),
  });
};
