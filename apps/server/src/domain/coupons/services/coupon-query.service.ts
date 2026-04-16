import type { CouponQueryRepo } from "../repository/coupon.repository.types";
import type { CouponQueryService } from "./coupon.service.types";

export function makeCouponQueryService(
  repo: CouponQueryRepo,
): CouponQueryService {
  return {
    listGlobalBillingPreviewDiscountRules: input =>
      repo.listGlobalBillingPreviewDiscountRules(input),
  };
}
