import { useMutation } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
export const useRejectDistributionRequestMutation = () => {
  return useMutation({
    mutationFn: ({id,data}: {id: string , data : {reason:string}}) =>
      distributionRequestService.rejectDistributionRequest({ id: id , data : data }),
  });
};
