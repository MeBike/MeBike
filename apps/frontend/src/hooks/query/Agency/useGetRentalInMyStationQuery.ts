import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
import type { RentalStatus } from "@/types";
const fetchMyRental = async ({page,pageSize,rental_status} : {page ?: number , pageSize ?: number , rental_status ?: RentalStatus}) => {
  try {
    const response = await agencyService.getRentalInMyStation({page,pageSize:pageSize,status:rental_status});
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetRentalInMyStationAgency = ({page,pageSize,rental_status} : {page ?: number , pageSize ?: number , rental_status ?: RentalStatus}) => {
  return useQuery({
    queryKey: ["data","rental-in-my-station","agency",page,pageSize,rental_status],
    queryFn: () => fetchMyRental({ page, pageSize,rental_status }),
  });
};
