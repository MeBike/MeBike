import type { CouponsContracts } from "@mebike/shared";

import type {
  ActiveCouponRuleRow,
  AdminCouponStatsRow,
  AdminCouponUsageLogRow,
  AdminCouponRuleRow,
} from "@/domain/coupons";

import { toMinorUnit } from "@/domain/shared/money";

export function toContractActiveCouponRules(
  rows: readonly ActiveCouponRuleRow[],
): CouponsContracts.ActiveCouponRulesResponse {
  return {
    data: rows.map((row) => {
      const discountValue = Number(toMinorUnit(row.discountValue));
      const nextMinRidingMinutes = rows.find(
        candidate => candidate.minRidingMinutes > row.minRidingMinutes,
      )?.minRidingMinutes;

      return {
        id: row.id,
        name: row.name,
        triggerType: row.triggerType,
        minRidingMinutes: row.minRidingMinutes,
        minBillableHours: row.minRidingMinutes / 60,
        discountType: row.discountType,
        discountValue,
        status: row.status,
        priority: row.priority,
        activeFrom: row.activeFrom?.toISOString() ?? null,
        activeTo: row.activeTo?.toISOString() ?? null,
        displayLabel: buildDisplayLabel({
          minRidingMinutes: row.minRidingMinutes,
          nextMinRidingMinutes,
          discountValue,
        }),
      };
    }),
  };
}

export function toContractAdminCouponRule(
  row: AdminCouponRuleRow,
): CouponsContracts.AdminCouponRule {
  return {
    id: row.id,
    name: row.name,
    triggerType: row.triggerType,
    minRidingMinutes: row.minRidingMinutes,
    minBillableHours: row.minRidingMinutes === null
      ? null
      : row.minRidingMinutes / 60,
    discountType: row.discountType,
    discountValue: Number(toMinorUnit(row.discountValue)),
    status: row.status,
    priority: row.priority,
    activeFrom: row.activeFrom?.toISOString() ?? null,
    activeTo: row.activeTo?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContractAdminCouponStats(
  stats: AdminCouponStatsRow,
): CouponsContracts.AdminCouponStatsResponse {
  return {
    range: {
      from: stats.range.from?.toISOString() ?? null,
      to: stats.range.to?.toISOString() ?? null,
    },
    summary: stats.summary,
    statsByDiscountAmount: [...stats.statsByDiscountAmount],
    topAppliedRule: stats.topAppliedRule
      ? {
          ruleId: stats.topAppliedRule.ruleId,
          name: stats.topAppliedRule.name,
          triggerType: stats.topAppliedRule.triggerType,
          minRidingMinutes: stats.topAppliedRule.minRidingMinutes,
          minBillableHours: stats.topAppliedRule.minRidingMinutes === null
            ? null
            : stats.topAppliedRule.minRidingMinutes / 60,
          discountType: stats.topAppliedRule.discountType,
          discountValue: stats.topAppliedRule.discountValue,
          appliedCount: stats.topAppliedRule.appliedCount,
          inferredFrom: stats.topAppliedRule.inferredFrom,
        }
      : null,
  };
}

export function toContractAdminCouponUsageLog(
  row: AdminCouponUsageLogRow,
): CouponsContracts.AdminCouponUsageLog {
  return {
    rentalId: row.rentalId,
    userId: row.userId,
    pricingPolicyId: row.pricingPolicyId,
    rentalStatus: row.rentalStatus,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime?.toISOString() ?? null,
    totalDurationMinutes: row.totalDurationMinutes,
    baseAmount: row.baseAmount,
    prepaidAmount: row.prepaidAmount,
    subscriptionApplied: row.subscriptionApplied,
    subscriptionDiscountAmount: row.subscriptionDiscountAmount,
    couponDiscountAmount: row.couponDiscountAmount,
    totalAmount: row.totalAmount,
    appliedAt: row.appliedAt.toISOString(),
    derivedTier: row.derivedTier,
  };
}

function buildDisplayLabel(input: {
  readonly minRidingMinutes: number;
  readonly nextMinRidingMinutes?: number;
  readonly discountValue: number;
}) {
  const from = formatDuration(input.minRidingMinutes);
  const discount = new Intl.NumberFormat("vi-VN").format(input.discountValue);

  if (!input.nextMinRidingMinutes) {
    return `\u0110i t\u1EEB ${from} gi\u1EA3m ${discount} VN\u0110`;
  }

  return [
    `\u0110i t\u1EEB ${from}`,
    `\u0111\u1EBFn d\u01B0\u1EDBi ${formatDuration(input.nextMinRidingMinutes)}`,
    `gi\u1EA3m ${discount} VN\u0110`,
  ].join(" ");
}

function formatDuration(minutes: number) {
  if (minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }

  return `${minutes} ph\u00FAt`;
}
