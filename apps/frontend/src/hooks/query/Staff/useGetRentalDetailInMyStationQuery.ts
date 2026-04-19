import { useQuery } from "@tanstack/react-query";
import { rentalService } from "@/services/rental.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyRentalDetail = async ({id} : {id:string}) => {
  try {
    const response = await rentalService.getRentalDetailInMyStation(id);
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetRentalDetailInMyStation = ({id} : {id:string}) => {
  return useQuery({
    queryKey: ["data","rental-detail-in-my-station",id],
    queryFn: () => fetchMyRentalDetail({ id }),
  });
};
