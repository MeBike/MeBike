import type { CouponsContracts } from "@mebike/shared";

import type { ActiveCouponRuleRow } from "@/domain/coupons";

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
