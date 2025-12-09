import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const fetchAllStations = async ({page,limit,name} : {page ?: number , limit ?: number, name ?: string}) => {
  try {
    const response = await stationService.getAllStations({page,limit,name});
    if (response.status === 200) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetAllStation = ({page,limit,name} : {page ?: number , limit ?: number, name ?: string}) => {
  return useQuery({
    queryKey: QUERY_KEYS.STATION.ALL(page, limit, name),
    queryFn: () => fetchAllStations({ page, limit, name }),
  });
};
