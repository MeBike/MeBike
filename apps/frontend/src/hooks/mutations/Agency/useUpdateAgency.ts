import { useMutation } from "@tanstack/react-query";
import type { UpdateAgencyFormData } from "@/schemas";
import { agencyService } from "@/services/agency.service";
export const useUpdateAgencyMutation = () => {
  return useMutation({
    mutationFn: ({id,data}:{id:string,data : Partial<UpdateAgencyFormData>}) => agencyService.updateAgency({id:id,data:data}),
  });
};
