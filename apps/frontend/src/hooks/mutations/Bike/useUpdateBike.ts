import { useMutation } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import type { UpdateBikeSchemaFormData } from "@/schemas/bikeSchema";

export const useUpdateBike = () => {
    return useMutation({
        mutationKey: ["bikes", "update"],
        mutationFn: ({ id, data }: { id: string; data: Partial<UpdateBikeSchemaFormData> }) => 
            bikeService.updateBike(id, data),
    });
};