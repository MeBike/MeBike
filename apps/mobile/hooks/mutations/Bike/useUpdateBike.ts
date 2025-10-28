import { useMutation } from "@tanstack/react-query";

import type { UpdateBikeSchemaFormData } from "@schemas/bikeSchema";

import { bikeService } from "@services/bikeService";

export function useUpdateBike() {
  return useMutation({
    mutationKey: ["bikes", "update"],
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateBikeSchemaFormData> }) =>
      bikeService.updateBike(id, data),
  });
}
