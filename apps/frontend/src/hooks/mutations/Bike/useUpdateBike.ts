import { useMutation } from "@tanstack/react-query";
import { bikeService } from "@/services/bikeService";
import type { UpdateBikeSchemaFormData } from "@/schemas/bikeSchema";
export const useUpdateBike = (id : string) => {
    return useMutation({
        mutationKey: ["bikes", "update", id],
        mutationFn: (data : Partial<UpdateBikeSchemaFormData>) => bikeService.updateBike(id, data),
    })
}