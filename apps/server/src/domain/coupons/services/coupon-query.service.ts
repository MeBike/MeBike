import type { CouponQueryRepo } from "../repository/coupon.repository.types";
import type { CouponQueryService } from "./coupon.service.types";

export function makeCouponQueryService(
  repo: CouponQueryRepo,
): CouponQueryService {
  return {
    listAdminCouponRules: (filter, pageReq) =>
      repo.listAdminCouponRules(filter, pageReq),
    getAdminCouponStats: input =>
      repo.getAdminCouponStats(input),
    listActiveGlobalCouponRules: input =>
      repo.listActiveGlobalCouponRules(input),
    listGlobalBillingPreviewDiscountRules: input =>
      repo.listGlobalBillingPreviewDiscountRules(input),
  };
}
