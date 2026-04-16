import type { CouponCommandRepo } from "../repository/coupon.repository.types";
import type { CouponCommandService } from "./coupon.service.types";

export function makeCouponCommandService(
  repo: CouponCommandRepo,
): CouponCommandService {
  return {
    createAdminCouponRule: input =>
      repo.createAdminCouponRule({
        name: input.name.trim(),
        triggerType: input.triggerType,
        minRidingMinutes: input.minRidingMinutes,
        minCompletedRentals: null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        priority: input.priority ?? 100,
        status: input.status ?? "INACTIVE",
        activeFrom: input.activeFrom ?? null,
        activeTo: input.activeTo ?? null,
      }),
  };
}
