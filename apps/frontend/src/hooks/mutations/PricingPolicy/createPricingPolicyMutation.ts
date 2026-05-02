import { useMutation } from "@tanstack/react-query";
import { pricingService } from "@services/pricing.service";
import { CreatePricingPolicyFormData } from "@/schemas/pricing-schema";

export const useCreatePricingPolicyMutation = () => {
  return useMutation({
    mutationKey: ["create-pricing-policy"],
    mutationFn: async (data: CreatePricingPolicyFormData) => pricingService.createPricingPolicy(data),
  });
};