import type {
  AccountStatus,
  CouponTriggerType,
  DiscountType,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

export type BillingPreviewDiscountRuleRow = {
  readonly ruleId: string;
  readonly name: string;
  readonly triggerType: CouponTriggerType;
  readonly minRidingMinutes: number | null;
  readonly discountType: DiscountType;
  readonly discountValue: PrismaTypes.Decimal;
  readonly priority: number;
  readonly createdAt: Date;
};

export type ActiveCouponRuleRow = {
  readonly id: string;
  readonly name: string;
  readonly triggerType: CouponTriggerType;
  readonly minRidingMinutes: number;
  readonly discountType: DiscountType;
  readonly discountValue: PrismaTypes.Decimal;
  readonly status: AccountStatus;
  readonly priority: number;
  readonly activeFrom: Date | null;
  readonly activeTo: Date | null;
  readonly createdAt: Date;
};
