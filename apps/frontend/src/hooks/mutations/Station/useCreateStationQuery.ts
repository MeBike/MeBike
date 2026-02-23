import { useMutation } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { StationSchemaFormData } from "@/schemas/stationSchema";
export const useCreateStationMutation = () => {
  return useMutation({
    mutationKey: ["create-station"],
    mutationFn: async (data: StationSchemaFormData) => {
      const response = await stationService.createStation(data);
      return response;
    },
  });
};
