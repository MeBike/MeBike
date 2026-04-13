import { useMutation } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
export const useRejectAgencyRequestMutation = () => {
  return useMutation({
    mutationFn: ({reason,description,id}:{description?:string,reason?:string,id:string}) => agencyService.rejectAgencyRequest({reason:reason,description:description,id:id}),
  });
};
