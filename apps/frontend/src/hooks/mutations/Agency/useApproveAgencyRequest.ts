import { useMutation } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
export const useApproveAgencyRequestMutation = () => {
  return useMutation({
    mutationFn: ({id,description}:{id:string,description?:string}) => agencyService.approveAgencyRequest({id:id,description:description}),
  });
};
