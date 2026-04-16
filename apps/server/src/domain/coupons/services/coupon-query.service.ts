import type { CouponQueryRepo } from "../repository/coupon.repository.types";
import type { CouponQueryService } from "./coupon.service.types";

export function makeCouponQueryService(
  repo: CouponQueryRepo,
): CouponQueryService {
  return {
    getForUserById: (userId, userCouponId) => repo.getForUserById(userId, userCouponId),
    listForUser: (userId, filter, pageReq) => repo.listForUser(userId, filter, pageReq),
    listBillingPreviewCandidatesForUser: (userId, input) =>
      repo.listBillingPreviewCandidatesForUser(userId, input),
  };
}
