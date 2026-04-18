export type TriggerType = "RIDING_DURATION" | "USAGE_FREQUENCY" 
| "CAMPAIGN" | "MEMBERSHIP_MILESTONE" | "MANUAL_GRANT"; 
export type DiscountType = "FIXED_AMOUNT" | "PERCENTAGE";
export type Status = "ACTIVE" | "INACTIVE" | "SUSPENDED" | 
"BANNED";
export type SourceFrom = "BILLING_RECORD_RULE" | 
"BILLING_RECORD_SNAPSHOT"
export interface Coupon {
  id: string;
  name: string;
  triggerType: TriggerType;
  minRidingMinutes: number;
  minBillableHours: number;
  discountType: DiscountType;
  discountValue: number;
  status: Status;
  priority: number;
  activeFrom: string | null;
  activeTo: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface DateRange {
  from: string;
  to: string;
}
export interface SummaryStats {
  totalCompletedRentals: number;
  discountedRentalsCount: number;
  nonDiscountedRentalsCount: number;
  discountRate: number;
  totalDiscountAmount: number;
  avgDiscountAmount: number;
}
export interface StatsByDiscountAmountItem {
  discountAmount: number;
  rentalsCount: number;
  totalDiscountAmount: number;
}
export interface StatsByRuleItem {
  ruleId: string;
  name: string;
  triggerType: TriggerType;
  minRidingMinutes: number;
  minBillableHours: number;
  discountType: DiscountType;
  discountValue: number;
  appliedCount: number;
  totalDiscountAmount: number;
  source: SourceFrom;
}
export interface TopAppliedRule {
  ruleId: string;
  name: string;
  triggerType: TriggerType;
  minRidingMinutes: number;
  minBillableHours: number;
  discountType: DiscountType;
  discountValue: number;
  appliedCount: number;
  inferredFrom: SourceFrom;
}
export interface CouponStat{
  range: DateRange;
  summary: SummaryStats;
  statsByDiscountAmount: StatsByDiscountAmountItem[];
  statsByRule: StatsByRuleItem[];
  topAppliedRule: TopAppliedRule | null;
}
interface CouponRuleSnapshot {
  id: string;
  name: string;
  minRidingMinutes: number;
  discountType: DiscountType;
  discountValue: number;
}

export type RentalStatus = "COMPLETED" | "CANCELLED" | "ONGOING";
export type DerivedTier = "TIER_1H_2H" | "TIER_2H_4H" | "TIER_4H_6H" | "TIER_6H_PLUS";
export interface CouponUsageLog {
  rentalId: string;
  userId: string;
  pricingPolicyId: string;
  rentalStatus: RentalStatus;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  baseAmount: number;
  prepaidAmount: number;
  subscriptionApplied: boolean;
  subscriptionDiscountAmount: number;
  couponRuleId: string;
  couponRuleName: string;
  couponRuleMinRidingMinutes: number;
  couponRuleDiscountType: DiscountType;
  couponRuleDiscountValue: number;
  couponDiscountAmount: number;
  totalAmount: number;
  appliedAt: string;
  derivedTier: DerivedTier;
}