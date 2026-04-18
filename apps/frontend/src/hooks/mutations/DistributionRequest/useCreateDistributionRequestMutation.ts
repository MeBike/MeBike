import { useMutation } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
import { CreateRedistributionRequestInput } from "@/schemas/distribution-request-schema";
export const useCreateistributionRequestMutation = () => {
  return useMutation({
    mutationFn: (data:CreateRedistributionRequestInput) =>
      distributionRequestService.createDistributionRequest({data:data}),
  });
};
