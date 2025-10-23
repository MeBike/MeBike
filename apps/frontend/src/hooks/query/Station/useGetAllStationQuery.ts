import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";

const fetchAllStations = async () => {
  try {
    const response = await stationService.getAllStations();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetAllStation = () => {
  return useQuery({
    queryKey: ["stations", "all"],
    queryFn: () => fetchAllStations(),
  });
};
