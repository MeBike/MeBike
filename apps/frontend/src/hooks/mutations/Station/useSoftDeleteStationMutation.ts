import { useMutation } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
export const useSoftDeleteStationMutation = () => {
  return useMutation({
    mutationKey: ["station", "soft-delete"],
    mutationFn: async (stationId: string) => {
      const response = await stationService.softDeleteStation({stationID: stationId});
      return response;
    },
    });
};