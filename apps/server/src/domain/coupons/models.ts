import type {
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
