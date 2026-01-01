import { useMutation } from "@tanstack/react-query";
import { stationService } from "@services/station.service";
import { StationSchemaFormData } from "@/schemas/stationSchema";
export const useUpdateStationMutation = (id: string) => {
  return useMutation({
    mutationKey: ["update-station", id],
    mutationFn: (stationData: StationSchemaFormData) =>
      stationService.updateStation({ id: id, stationData }),
  });
};