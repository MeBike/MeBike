import { useQuery } from "@tanstack/react-query";

import type { ActiveCouponRulesResponse } from "@/contracts/server";
import type { CouponRuleError } from "@services/coupons";

import { couponRuleService } from "@services/coupons";

import { couponRuleQueryKeys } from "./coupon-query-keys";

export function useActiveCouponRulesQuery(enabled: boolean = true) {
  return useQuery<ActiveCouponRulesResponse, CouponRuleError>({
    queryKey: couponRuleQueryKeys.active(),
    enabled,
    queryFn: async () => {
      const result = await couponRuleService.listActive();
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    staleTime: 5 * 60 * 1000,
  });
}
