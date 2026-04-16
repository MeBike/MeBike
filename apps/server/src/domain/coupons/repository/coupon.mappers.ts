import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { UserCouponListItemRow } from "../models";

export const selectUserCouponListItemRow = {
  id: true,
  couponId: true,
  assignedAt: true,
  usedAt: true,
  lockedAt: true,
  lockExpiresAt: true,
  status: true,
  coupon: {
    select: {
      code: true,
      discountType: true,
      discountValue: true,
      expiresAt: true,
      couponRuleId: true,
      couponRule: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies PrismaTypes.UserCouponSelect;

type UserCouponListItemRecord = PrismaTypes.UserCouponGetPayload<{
  select: typeof selectUserCouponListItemRow;
}>;

export function toUserCouponListItemRow(
  row: UserCouponListItemRecord,
): UserCouponListItemRow {
  return {
    userCouponId: row.id,
    couponId: row.couponId,
    code: row.coupon.code,
    status: row.status,
    discountType: row.coupon.discountType,
    discountValue: row.coupon.discountValue,
    expiresAt: row.coupon.expiresAt,
    assignedAt: row.assignedAt,
    usedAt: row.usedAt,
    lockedAt: row.lockedAt,
    lockExpiresAt: row.lockExpiresAt,
    couponRuleId: row.coupon.couponRuleId,
    couponRuleName: row.coupon.couponRule?.name ?? null,
  };
}
