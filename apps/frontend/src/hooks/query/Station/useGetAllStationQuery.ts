import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const fetchAllStations = async ({page,limit,name,stationType} : {page ?: number , limit ?: number, name ?: string,stationType ?: string}) => {
  try {
    const response = await stationService.getAllStations({page,pageSize:limit,name,stationType});
    if (response.status === 200) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetAllStation = ({page,limit,name,stationType} : {page ?: number , limit ?: number, name ?: string,stationType ?: string}) => {
  return useQuery({
    queryKey: QUERY_KEYS.STATION.ALL(page, limit, name),
    queryFn: () => fetchAllStations({ page, limit, name ,stationType }),
  });
};
