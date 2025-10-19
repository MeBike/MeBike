import { useQuery } from "@tanstack/react-query";
import { stationService } from "@services/stationService";
const fetchAllStations = async () => {
  try {
    const response = await stationService.getAllStations();
    if(response.status === 200 ) {
      return response.data.data;
    }
  } catch (error) {
    throw new Error("Failed to fetch stations");
  }
}
export const useGetAllStation = () => {
    return useQuery({
      queryKey: ["all-stations"],
      queryFn: fetchAllStations,
    });
}