import { useMutation } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
export const useApproveDistributionRequestMutation = () => {
  return useMutation({
    mutationFn: (id: string) =>
      distributionRequestService.approveDistributionRequest({ id: id }),
  });
};
