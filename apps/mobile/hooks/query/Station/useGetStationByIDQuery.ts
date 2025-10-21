import { useQuery } from "@tanstack/react-query";
import { stationService } from "@services/stationService";
import type { StationType } from "../../../types/StationType";

const fetchStationByID = async (id: string) => {
  try {
    const response = await stationService.getStationById(id);
     if (response.status === 200 && response.data?.result) {
       return response.data.result;
     }
  } catch (error) {
    throw new Error("Failed to fetch stations with id " + id);
  }
};
export const useGetStationById = (stationId: string) => {
  return useQuery({
    queryKey: ["station", stationId],
    queryFn: () => fetchStationByID(stationId),
    enabled: !!stationId,
  });
};
