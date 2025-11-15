import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
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
  return useQuery({
    queryKey: ["station-revenue"],
    queryFn: () => getStationRevenue(),
    enabled: false,
  });
};
