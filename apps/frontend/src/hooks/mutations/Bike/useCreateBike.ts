import { useMutation } from "@tanstack/react-query";
import type { BikeSchemaFormData } from "@schemas/bikeSchema";
import { bikeService } from "@/services/bike.service";
export const useCreateBikeMutation = () => {
  return useMutation({
    mutationFn: (data: BikeSchemaFormData) => bikeService.createBikeAdmin(data),
  });
};
