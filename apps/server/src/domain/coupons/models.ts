import type {
  CouponStatus,
  CouponTriggerType,
  DiscountType,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

export type UserCouponListItemRow = {
  readonly userCouponId: string;
  readonly couponId: string;
  readonly code: string;
  readonly status: CouponStatus;
  readonly discountType: DiscountType;
  readonly discountValue: PrismaTypes.Decimal;
  readonly expiresAt: Date | null;
  readonly assignedAt: Date;
  readonly usedAt: Date | null;
  readonly lockedAt: Date | null;
  readonly lockExpiresAt: Date | null;
  readonly couponRuleId: string | null;
  readonly couponRuleName: string | null;
};

export type UserCouponDetailRow = UserCouponListItemRow & {
  readonly couponRuleTriggerType: CouponTriggerType | null;
  readonly couponRuleMinRidingMinutes: number | null;
};

export type CouponSortField = "assignedAt";

export type CouponFilter = {
  readonly status?: CouponStatus;
};
