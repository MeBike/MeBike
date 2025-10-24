import { useMutation } from "@tanstack/react-query";
import { withdrawalsService } from "@/services/withdrawal.service";
import { UpdateWithdrawSchemaFormData } from "@/schemas/withdrawalSchema";
export const useUpdateWithdrawRequestMutation = (id: string) => {
  return useMutation({
    mutationKey: ["updateWithdrawRequest", id],
    mutationFn: async (data: UpdateWithdrawSchemaFormData) =>
      withdrawalsService.updateWithdrawRequestById(id, data),
  });
};
