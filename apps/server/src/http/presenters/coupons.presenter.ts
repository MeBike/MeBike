import type { CouponsContracts } from "@mebike/shared";

import type { UserCouponListItemRow } from "@/domain/coupons";

export function toUserCouponListItem(
  row: UserCouponListItemRow,
): CouponsContracts.UserCouponListItem {
  return {
    userCouponId: row.userCouponId,
    couponId: row.couponId,
    code: row.code,
    status: row.status,
    discountType: row.discountType,
    discountValue: row.discountValue.toString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    assignedAt: row.assignedAt.toISOString(),
    usedAt: row.usedAt ? row.usedAt.toISOString() : null,
    lockedAt: row.lockedAt ? row.lockedAt.toISOString() : null,
    lockExpiresAt: row.lockExpiresAt ? row.lockExpiresAt.toISOString() : null,
    couponRuleId: row.couponRuleId,
    couponRuleName: row.couponRuleName,
  };
}
