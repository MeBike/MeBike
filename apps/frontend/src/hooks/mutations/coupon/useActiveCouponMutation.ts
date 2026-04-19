import { useMutation } from "@tanstack/react-query";
import { couponService } from "@/services/coupon.service";
export const useActiveCouponMutation = () => {
  return useMutation({
    mutationFn: (id: string) => couponService.activeCoupon(id),
  });
};
