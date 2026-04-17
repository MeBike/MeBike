import { useMutation } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
export const useCompleteTransitDistributionRequestMutation = () => {
  return useMutation({
    mutationFn: ({id,data}: {id: string , data : {completedBikeIds:string[]}}) =>
      distributionRequestService.confirmCompletionDistributionRequest({ id: id , data : data }),
  });
};
