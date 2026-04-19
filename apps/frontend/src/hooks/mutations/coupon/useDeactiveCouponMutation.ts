import { useMutation } from "@tanstack/react-query";
import { couponService } from "@/services/coupon.service";
export const useDeactiveCouponMutation = () => {
  return useMutation({
    mutationFn: (id: string) => couponService.deactiveCoupon(id),
  });
};
