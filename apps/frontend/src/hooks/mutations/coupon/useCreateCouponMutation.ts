import { useMutation } from "@tanstack/react-query";
import type { CreateAdminCouponRuleBody } from "@/schemas/coupon-schema";
import { couponService } from "@/services/coupon.service";
export const useCreateCouponMutation = () => {
  return useMutation({
    mutationFn: (data: CreateAdminCouponRuleBody) => couponService.createCoupon(data),
  });
};
