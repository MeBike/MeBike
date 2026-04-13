import { useMutation } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
export const useCancelAgencyRequestMutation = () => {
  return useMutation({
    mutationFn: ({id}:{id:string}) => agencyService.cancelAgencyRequest({id:id}),
  });
};
