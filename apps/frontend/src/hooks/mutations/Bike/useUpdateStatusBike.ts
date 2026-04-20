import { useMutation } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";

export const useUpdateBikeStatus = () => {
    return useMutation({
        mutationKey: ["bikes", "update-status"],
        mutationFn: ({ id, status }: { id: string; status : "AVAILABLE" | "BROKEN" }) => 
            bikeService.updateBikeStatus({id,status}),
    });
};