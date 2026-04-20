import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyStations = async ({page,pageSize,name} : {page ?: number , pageSize ?: number, name ?: string}) => {
  try {
    const response = await stationService.getMyStations({page,pageSize,name});
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetMyStations = ({page,pageSize,name} : {page ?: number , pageSize ?: number, name ?: string}) => {
  return useQuery({
    queryKey: ["my","stations",page,pageSize,name],
    queryFn: () => fetchMyStations({ page, pageSize, name }),
    enabled:false,
  });
};
