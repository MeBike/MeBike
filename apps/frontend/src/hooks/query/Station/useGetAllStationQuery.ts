import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";

const fetchAllStations = async ({page,limit} : {page ?: number , limit ?: number}) => {
  try {
    const response = await stationService.getAllStations({page,limit});
    if (response.status === 200) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetAllStation = ({page,limit} : {page ?: number , limit ?: number}) => {
  return useQuery({
    queryKey: ["stations", "all" , page , limit],
    queryFn: () => fetchAllStations({page,limit}),
    
  });
};
