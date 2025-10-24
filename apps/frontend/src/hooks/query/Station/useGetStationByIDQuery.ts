import { useQuery } from "@tanstack/react-query";
import { stationService } from "@services/station.service";
const fetchStationByID = async (id: string) => {
  try {
    const response = await stationService.getStationById(id);
    if (response.status === 200 && response.data?.result) {
      return response.data.result;
    }
    return null;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch stations with id " + id);
  }
};
export const useGetStationByIDQuery = (stationId: string) => {
  return useQuery({
    queryKey: ["station", stationId],
    queryFn: () => fetchStationByID(stationId),
    enabled: !!stationId,
  });
};
