import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { HTTP_STATUS } from "@/constants";
const getStationRevenueForManager = async () => {
  try {
    const response = await stationService.getStationRevenueForManager();
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch station bike revenue");
  }
};
export const useGetStationRevenueForManager = () => {
  return useQuery({
    queryKey: ["manager","station","revenue"],
    queryFn: getStationRevenueForManager,
    enabled: false,
  });
};