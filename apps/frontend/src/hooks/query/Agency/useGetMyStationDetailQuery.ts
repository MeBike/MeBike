import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
const fetchMyStationDetail = async ({stationId} : {stationId : string}) => {
  try {
    const response = await agencyService.getMyStationDetail(stationId);
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetMyStationDetailAgency = ({stationId} : {stationId : string}) => {
  return useQuery({
    queryKey: ["data","station-detail","agency",stationId],
    queryFn: () => fetchMyStationDetail({ stationId }),
    enabled:!!stationId,
  });
};
