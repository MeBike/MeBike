import { useMutation } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
export const useUpdateStatusStationMutation = () => {
  return useMutation({
    mutationKey: ["station", "update-status"],
    mutationFn: async ({id} : { id : string}) => {
      const response = await stationService.updateStationStatus({
        id: id,
      });
      return response;
    },
  });
};
