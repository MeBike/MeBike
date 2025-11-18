import { useMutation } from "@tanstack/react-query";
import { sosService } from "@/services/sos.service";
import type { ResolveSOSSchema } from "@/schemas/sosSchema";

export const useResolveSOSRequestMutation = (sosId: string) => {
  return useMutation({
    mutationKey: ["resolve-sos-request", sosId],
    mutationFn: (data: ResolveSOSSchema ) =>
      sosService.resolveSOSRequest({id: sosId, data : data}),
  });
};
 