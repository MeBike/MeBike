import { useMutation } from "@tanstack/react-query";
import { sosService } from "@/services/sos.service";
import type { AssignSOSSchema } from "@/schemas/sosSchema";

export const useAssignSOSRequestMutation = (sosId: string) => {
    return useMutation({
        mutationKey: ["assign-sos-request", sosId],
        mutationFn: (data: AssignSOSSchema) =>
            sosService.assignSOSRequest(sosId, data),
    });
}  