import { useMutation } from "@tanstack/react-query";
import { stationService } from "@services/station.service";
import { StationSchemaFormData } from "@/schemas/stationSchema";
export const useUpdateStationMutation = (stationId: string) => {
  return useMutation({
    mutationKey: ["update-station", stationId], 
    mutationFn: (stationData: StationSchemaFormData) =>
      stationService.updateStation({ stationID: stationId, stationData }),
  });
};