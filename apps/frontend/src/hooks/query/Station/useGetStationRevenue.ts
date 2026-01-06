import { useSuspenseQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const getStationRevenue = async () => {
  try {
    const response = await stationService.getStationRevenue();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch station bike revenue");
  }
};
export const useGetStationRevenue = () => {
  return useSuspenseQuery({
    queryKey: QUERY_KEYS.STATION.STATION_REVENUE,
    queryFn: () => getStationRevenue(),
  });
};
