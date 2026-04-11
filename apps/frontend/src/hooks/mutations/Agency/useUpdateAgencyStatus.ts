import { useMutation } from "@tanstack/react-query";
import type { UpdateAgencyStatusFormData } from "@/schemas";
import { agencyService } from "@/services/agency.service";
export const useUpdateAgencyStatusMutation = () => {
  return useMutation({
    mutationFn: ({id,data}:{id:string,data : UpdateAgencyStatusFormData}) => agencyService.updateAgencyStatus({id:id,data:data}),
  });
};
