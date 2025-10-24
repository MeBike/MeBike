import { useMutation } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { StationSchemaFormData } from "@/schemas/stationSchema";
export const useCreateSupplierMutation = () => {
  return useMutation({
    mutationKey: ["create-supplier"],
    mutationFn: async (data: StationSchemaFormData) => {
      const response = await stationService.createStation(data);
      return response;
    },
  });
};
