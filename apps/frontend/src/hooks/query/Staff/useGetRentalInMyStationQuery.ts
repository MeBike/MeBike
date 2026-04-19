import { useQuery } from "@tanstack/react-query";
import { rentalService } from "@/services/rental.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyRental = async ({page,limit} : {page ?: number , limit ?: number}) => {
  try {
    const response = await rentalService.getRentalInMyStation({page,pageSize:limit});
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetRentalInMyStation = ({page,limit} : {page ?: number , limit ?: number}) => {
  return useQuery({
    queryKey: ["data","rental-in-my-station",page,limit],
    queryFn: () => fetchMyRental({ page, limit }),
  });
};
