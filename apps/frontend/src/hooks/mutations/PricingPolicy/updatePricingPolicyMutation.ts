import { useMutation } from "@tanstack/react-query";
import { pricingService } from "@services/pricing.service";
import { UpdatePricingPolicyFormData } from "@/schemas/pricing-schema";
export const useUpdatePricingPolicyMutation = () => {
  return useMutation({
    mutationKey: ["update-pricing-policy"],
    mutationFn: async ({id, data}: {id: string, data: UpdatePricingPolicyFormData}) => pricingService.updatePricingPolicy(id, data),
  });
};