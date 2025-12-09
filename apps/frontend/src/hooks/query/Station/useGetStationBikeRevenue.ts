import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const getStationBikeRevenue = async () => {
  try {
    const response = await stationService.getStationBikeRevenue();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch station bike revenue");
  }
};
export const useGetStationBikeRevenue = () => {
  return useQuery({
    queryKey: QUERY_KEYS.STATION.STATION_BIKE_REVENUE,
    queryFn: getStationBikeRevenue,
    enabled: false,
  });
};