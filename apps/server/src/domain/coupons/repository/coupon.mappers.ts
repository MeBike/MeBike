import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type {
  UserCouponDetailRow,
  UserCouponListItemRow,
} from "../models";

const selectCouponRuleListSummary = {
  name: true,
} satisfies PrismaTypes.CouponRuleSelect;

const selectCouponRuleDetailSummary = {
  name: true,
  triggerType: true,
  minRidingMinutes: true,
} satisfies PrismaTypes.CouponRuleSelect;

const selectCouponSummary = {
  code: true,
  discountType: true,
  discountValue: true,
  expiresAt: true,
  couponRuleId: true,
} satisfies PrismaTypes.CouponSelect;

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
      ...selectCouponSummary,
      couponRule: {
        select: selectCouponRuleListSummary,
      },
    },
  },
} satisfies PrismaTypes.UserCouponSelect;

export const selectUserCouponDetailRow = {
  id: true,
  couponId: true,
  assignedAt: true,
  usedAt: true,
  lockedAt: true,
  lockExpiresAt: true,
  status: true,
  coupon: {
    select: {
      ...selectCouponSummary,
      couponRule: {
        select: selectCouponRuleDetailSummary,
      },
    },
  },
} satisfies PrismaTypes.UserCouponSelect;

type UserCouponListItemRecord = PrismaTypes.UserCouponGetPayload<{
  select: typeof selectUserCouponListItemRow;
}>;

type UserCouponDetailRecord = PrismaTypes.UserCouponGetPayload<{
  select: typeof selectUserCouponDetailRow;
}>;

function toUserCouponBaseRow(
  row: UserCouponListItemRecord | UserCouponDetailRecord,
) {
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
  } as const;
}

export function toUserCouponListItemRow(
  row: UserCouponListItemRecord,
): UserCouponListItemRow {
  return {
    ...toUserCouponBaseRow(row),
    couponRuleId: row.coupon.couponRuleId,
    couponRuleName: row.coupon.couponRule?.name ?? null,
  };
}

export function toUserCouponDetailRow(
  row: UserCouponDetailRecord,
): UserCouponDetailRow {
  return {
    ...toUserCouponBaseRow(row),
    couponRuleId: row.coupon.couponRuleId,
    couponRuleName: row.coupon.couponRule?.name ?? null,
    couponRuleTriggerType: row.coupon.couponRule?.triggerType ?? null,
    couponRuleMinRidingMinutes: row.coupon.couponRule?.minRidingMinutes ?? null,
  };
}
