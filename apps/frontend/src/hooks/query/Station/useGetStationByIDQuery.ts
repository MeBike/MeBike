import { useQuery } from "@tanstack/react-query";
import { stationService } from "@services/station.service";
import { QUERY_KEYS } from "@constants/queryKey";
import { HTTP_STATUS } from "@/constants";
const getStationByID = async (id: string) => {
  try {
    console.log(id);
    const response = await stationService.getStationById(id);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch stations with id " + id);
  }
};
export const useGetStationByIDQuery = (stationId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.STATION.DETAIL(stationId),
    queryFn: () => getStationByID(stationId),
    enabled : !!stationId && stationId !== ""
  });
};
