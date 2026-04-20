import { useMutation } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
export const useUpdateStatusBikeMutation = () => {
    return useMutation({
        mutationKey: ["bikes", "status"],
        mutationFn: ({id,status}:{
            id:string,
            status:"AVAILABLE" | "BROKEN"
        }) => agencyService.updateBikeStatus({id,status}),
    })
}