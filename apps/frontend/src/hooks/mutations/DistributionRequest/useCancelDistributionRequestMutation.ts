import { useMutation } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
export const useCancelDistributionRequestMutation = () => {
  return useMutation({
    mutationFn: ({id,data}: {id: string , data : {reason:string}}) =>
      distributionRequestService.cancelDistributionRequest({ id: id , data : data }),
  });
};
