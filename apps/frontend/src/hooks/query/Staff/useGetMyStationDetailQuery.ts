import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyStationDetail = async ({stationId} : {stationId : string}) => {
  try {
    const response = await stationService.getMyStationDetail(stationId);
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetMyStationDetail = ({stationId} : {stationId : string}) => {
  return useQuery({
    queryKey: ["my","station-detail",stationId],
    queryFn: () => fetchMyStationDetail({ stationId }),
    enabled:!!stationId,
  });
};
