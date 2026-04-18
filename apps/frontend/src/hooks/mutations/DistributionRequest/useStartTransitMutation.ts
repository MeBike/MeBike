import { useMutation } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
export const useStartTransitDistributionRequestMutation = () => {
  return useMutation({
    mutationFn: (id: string) =>
      distributionRequestService.startTransitDistributionRequest({ id: id }),
  });
};
