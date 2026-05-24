import { useMutation } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";

export const useRevertRemainingBikeMutation = () => {
  return useMutation({
    mutationFn: ({requestId} : {requestId: string}) =>
      distributionRequestService.revertRemainingBike({ requestId }),
  });
};
