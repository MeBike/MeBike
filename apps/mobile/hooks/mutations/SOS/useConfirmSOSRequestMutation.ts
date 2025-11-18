import { useMutation } from "@tanstack/react-query";
import { sosService } from "@/services/sos.service";
export const useConfirmSOSRequestMutation = (sosId: string) => {
    return useMutation({
        mutationKey: ["confirm-sos-request", sosId],
        mutationFn: () =>
            sosService.confirmSOSRequest(sosId),
    })
}