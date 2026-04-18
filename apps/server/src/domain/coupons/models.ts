import type { PageResult } from "@/domain/shared/pagination";
import type {
  AccountStatus,
  CouponTriggerType,
  DiscountType,
  Prisma as PrismaTypes,
  RentalStatus,
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

export type CouponStatsRange = {
  readonly from: Date | null;
  readonly to: Date | null;
};

export type CouponStatsSummaryRow = {
  readonly totalCompletedRentals: number;
  readonly discountedRentalsCount: number;
  readonly nonDiscountedRentalsCount: number;
  readonly discountRate: number;
  readonly totalDiscountAmount: number;
  readonly avgDiscountAmount: number;
};

export type CouponStatsByDiscountAmountRow = {
  readonly discountAmount: number;
  readonly rentalsCount: number;
  readonly totalDiscountAmount: number;
};

export type CouponRuleSnapshot = {
  readonly ruleId: string;
  readonly name: string;
  readonly triggerType: "RIDING_DURATION";
  readonly minRidingMinutes: number;
  readonly discountType: "FIXED_AMOUNT";
  readonly discountValue: number;
  readonly priority: number;
  readonly billableMinutes: number;
  readonly billableHours: number;
  readonly appliedAt: string;
};

export type CouponStatsByRuleRow = {
  readonly ruleId: string;
  readonly name: string;
  readonly triggerType: "RIDING_DURATION";
  readonly minRidingMinutes: number | null;
  readonly discountType: "FIXED_AMOUNT";
  readonly discountValue: number;
  readonly appliedCount: number;
  readonly totalDiscountAmount: number;
  readonly source: "BILLING_RECORD_RULE" | "BILLING_RECORD_SNAPSHOT";
};

export type CouponTopAppliedRuleRow = {
  readonly ruleId: string;
  readonly name: string;
  readonly triggerType: "RIDING_DURATION";
  readonly minRidingMinutes: number | null;
  readonly discountType: "FIXED_AMOUNT";
  readonly discountValue: number;
  readonly appliedCount: number;
  readonly inferredFrom: "BILLING_RECORD_RULE" | "BILLING_RECORD_SNAPSHOT";
};

export type AdminCouponStatsRow = {
  readonly range: CouponStatsRange;
  readonly summary: CouponStatsSummaryRow;
  readonly statsByRule: readonly CouponStatsByRuleRow[];
  readonly statsByDiscountAmount: readonly CouponStatsByDiscountAmountRow[];
  readonly topAppliedRule: CouponTopAppliedRuleRow | null;
};

export type CouponUsageDerivedTier
  = | "TIER_1H_2H"
  | "TIER_2H_4H"
  | "TIER_4H_6H"
  | "TIER_6H_PLUS";

export type AdminCouponUsageLogRow = {
  readonly rentalId: string;
  readonly userId: string;
  readonly pricingPolicyId: string;
  readonly rentalStatus: RentalStatus;
  readonly startTime: Date;
  readonly endTime: Date | null;
  readonly totalDurationMinutes: number;
  readonly baseAmount: number;
  readonly prepaidAmount: number;
  readonly subscriptionApplied: boolean;
  readonly subscriptionDiscountAmount: number;
  readonly couponRuleId: string | null;
  readonly couponRuleName: string | null;
  readonly couponRuleMinRidingMinutes: number | null;
  readonly couponRuleDiscountType: "FIXED_AMOUNT" | null;
  readonly couponRuleDiscountValue: number | null;
  readonly couponDiscountAmount: number;
  readonly totalAmount: number;
  readonly appliedAt: Date;
  readonly derivedTier: CouponUsageDerivedTier | null;
};

export type ListAdminCouponUsageLogsFilter = {
  readonly from?: Date;
  readonly to?: Date;
  readonly userId?: string;
  readonly rentalId?: string;
  readonly discountAmount?: number;
  readonly subscriptionApplied?: boolean;
};

export type AdminCouponUsageLogPageResult = PageResult<AdminCouponUsageLogRow>;
