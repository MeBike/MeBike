import { useMutation } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import type { AdminCreateAgencyUserRequest } from "@/schemas";
export const useCreateAgencyMutation = () => {
  return useMutation({
    mutationFn: (data: AdminCreateAgencyUserRequest) => agencyService.adminCreateAgency({data:data}),
  });
};
