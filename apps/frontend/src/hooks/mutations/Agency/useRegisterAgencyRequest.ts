import { useMutation } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { RegisterAgencyFormData } from "@/schemas";
export const useRegisterAgencyRequestMutation = () => {
  return useMutation({
    mutationFn: ({data}:{data:RegisterAgencyFormData}) => agencyService.registerAgency({data : data}),
  });
};
