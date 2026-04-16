import type { CouponsContracts } from "@mebike/shared";

import type {
  UserCouponDetailRow,
  UserCouponListItemRow,
} from "@/domain/coupons";

function toISOStringOrNull(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toBillableHoursString(minutes: number | null): string | null {
  if (minutes === null) {
    return null;
  }

  const hours = minutes / 60;
  return Number.isInteger(hours) ? hours.toString() : hours.toFixed(2).replace(/\.?0+$/, "");
}

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
    expiresAt: toISOStringOrNull(row.expiresAt),
    assignedAt: row.assignedAt.toISOString(),
    usedAt: toISOStringOrNull(row.usedAt),
    lockedAt: toISOStringOrNull(row.lockedAt),
    lockExpiresAt: toISOStringOrNull(row.lockExpiresAt),
    couponRuleId: row.couponRuleId,
    couponRuleName: row.couponRuleName,
  };
}

export function toUserCouponDetail(
  row: UserCouponDetailRow,
): CouponsContracts.CouponDetailResponse {
  const minimumBillableHours = toBillableHoursString(row.couponRuleMinRidingMinutes);

  return {
    userCouponId: row.userCouponId,
    couponId: row.couponId,
    couponRuleId: row.couponRuleId,
    couponRuleName: row.couponRuleName,
    code: row.code,
    status: row.status,
    discountType: row.discountType,
    discountValue: row.discountValue.toString(),
    expiresAt: toISOStringOrNull(row.expiresAt),
    assignedAt: row.assignedAt.toISOString(),
    usedAt: toISOStringOrNull(row.usedAt),
    lockedAt: toISOStringOrNull(row.lockedAt),
    lockExpiresAt: toISOStringOrNull(row.lockExpiresAt),
    description: null,
    coupon: {
      id: row.couponId,
      code: row.code,
      discountType: row.discountType,
      discountValue: row.discountValue.toString(),
      expiresAt: toISOStringOrNull(row.expiresAt),
      rule: {
        id: row.couponRuleId,
        name: row.couponRuleName,
        triggerType: row.couponRuleTriggerType,
        minRidingMinutes: row.couponRuleMinRidingMinutes,
        minBillableHours: minimumBillableHours,
      },
    },
    conditions: {
      requiresNoSubscription: true,
      usesBillableHours: true,
      billableMinutesPerBlock: 30,
      billableHoursPerBlock: "0.5",
      minimumBillableHours,
      appliesToPenalty: false,
      appliesToDepositForfeited: false,
      appliesToOtherFees: false,
      maxCouponsPerRental: 1,
    },
  };
}
