import { useMutation } from "@tanstack/react-query";
import { pricingService } from "@services/pricing.service";

export const useActivePricingPolicyMutation = () => {
  return useMutation({
    mutationKey: ["active-pricing-policy"],
    mutationFn: async (id: string) => pricingService.activePricingPolicy(id),
  });
};