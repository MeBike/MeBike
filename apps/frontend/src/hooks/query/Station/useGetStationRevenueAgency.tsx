import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { HTTP_STATUS } from "@/constants";
const getStationRevenueForAgency = async () => {
  try {
    const response = await stationService.getStationRevenueForAgency();
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch station bike revenue");
  }
};
export const useGetStationRevenueForAgency = () => {
  return useQuery({
    queryKey: ["agency","station","revenue"],
    queryFn: getStationRevenueForAgency,
    enabled: false,
  });
};