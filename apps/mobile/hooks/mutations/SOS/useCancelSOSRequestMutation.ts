import { useMutation } from "@tanstack/react-query";
import { sosService } from "@/services/sos.service";
import type { CancelSOSSchema } from "@/schema/sosSchema";

export const useCancelSOSRequestMutation = (sosId: string) => {
  return useMutation({
    mutationKey: ["cancel-sos-request", sosId],
    mutationFn: (data: CancelSOSSchema) =>
      sosService.cancelSOSRequest({ id: sosId, data }),
  });
};
