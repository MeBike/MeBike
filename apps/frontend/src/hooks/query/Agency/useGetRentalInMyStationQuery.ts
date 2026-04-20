import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyRental = async ({page,pageSize} : {page ?: number , pageSize ?: number}) => {
  try {
    const response = await agencyService.getRentalInMyStation({page,pageSize:pageSize});
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetRentalInMyStationAgency = ({page,pageSize} : {page ?: number , pageSize ?: number}) => {
  return useQuery({
    queryKey: ["data","rental-in-my-station","agency",page,pageSize],
    queryFn: () => fetchMyRental({ page, pageSize }),
  });
};
