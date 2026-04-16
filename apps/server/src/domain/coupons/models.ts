import type {
  AccountStatus,
  CouponTriggerType,
  DiscountType,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { PageResult } from "@/domain/shared/pagination";

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

export type AdminCouponRuleRow = {
  readonly id: string;
  readonly name: string;
  readonly triggerType: CouponTriggerType;
  readonly minRidingMinutes: number | null;
  readonly discountType: DiscountType;
  readonly discountValue: PrismaTypes.Decimal;
  readonly status: AccountStatus;
  readonly priority: number;
  readonly activeFrom: Date | null;
  readonly activeTo: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CouponRuleWritableStatus = "ACTIVE" | "INACTIVE";

export type CreateAdminCouponRuleInput = {
  readonly name: string;
  readonly triggerType: "RIDING_DURATION";
  readonly minRidingMinutes: number;
  readonly discountType: "FIXED_AMOUNT";
  readonly discountValue: number;
  readonly priority?: number;
  readonly status?: CouponRuleWritableStatus;
  readonly activeFrom?: Date | null;
  readonly activeTo?: Date | null;
};

export type UpdateAdminCouponRuleInput = {
  readonly name: string;
  readonly triggerType: "RIDING_DURATION";
  readonly minRidingMinutes: number;
  readonly discountType: "FIXED_AMOUNT";
  readonly discountValue: number;
  readonly priority: number;
  readonly status: CouponRuleWritableStatus;
  readonly activeFrom: Date | null;
  readonly activeTo: Date | null;
};

export type CreateCouponRuleData = {
  readonly name: string;
  readonly triggerType: "RIDING_DURATION";
  readonly minRidingMinutes: number;
  readonly minCompletedRentals: null;
  readonly discountType: "FIXED_AMOUNT";
  readonly discountValue: number;
  readonly priority: number;
  readonly status: CouponRuleWritableStatus;
  readonly activeFrom: Date | null;
  readonly activeTo: Date | null;
};

export type UpdateCouponRuleData = {
  readonly name: string;
  readonly triggerType: "RIDING_DURATION";
  readonly minRidingMinutes: number;
  readonly minCompletedRentals: null;
  readonly discountType: "FIXED_AMOUNT";
  readonly discountValue: number;
  readonly priority: number;
  readonly status: CouponRuleWritableStatus;
  readonly activeFrom: Date | null;
  readonly activeTo: Date | null;
};

export type ListAdminCouponRulesFilter = {
  readonly status?: AccountStatus;
  readonly triggerType?: CouponTriggerType;
  readonly discountType?: DiscountType;
};

export type AdminCouponRulePageResult = PageResult<AdminCouponRuleRow>;
