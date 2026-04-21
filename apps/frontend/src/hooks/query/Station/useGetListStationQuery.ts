import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { HTTP_STATUS } from "@/constants";
const fetchListStations = async () => {
  try {
    const response = await stationService.getListStations();
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetListStation = () => {
  return useQuery({
    queryKey: ["list-station"],
    queryFn: () => fetchListStations(),
    enabled:false,
  });
};
