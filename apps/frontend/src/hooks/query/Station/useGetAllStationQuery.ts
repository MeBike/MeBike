import { useSuspenseQuery} from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { QUERY_KEYS } from "@/constants/queryKey";
import { HTTP_STATUS } from "@/constants";
const getAllStations = async ({page,limit,name,search} : {page ?: number , limit ?: number, name ?: string, search ?: string}) => {
  try {
    const response = await stationService.getAllStations({page,limit,name,search});
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetAllStation = ({page,limit,name,search} : {page ?: number , limit ?: number, name ?: string, search ?: string}) => {
  return useSuspenseQuery ({
    queryKey: QUERY_KEYS.STATION.ALL(page, limit, name, search),
    queryFn: () => getAllStations({ page, limit, name, search }),
    staleTime : 1000 * 60 * 5,
  });
};
