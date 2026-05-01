import type { PricingPoliciesContracts } from "@mebike/shared";

import type { PricingPolicyRow } from "@/domain/pricing";
import type { PricingPolicyUsageSummary } from "@/domain/pricing/repository/pricing-policy.repository.types";

function formatWallClockTime(date: Date): string {
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");

  return `${hour}:${minute}:${second}`;
}

export function toContractPricingPolicy(
  policy: PricingPolicyRow,
): PricingPoliciesContracts.PricingPolicy {
  return {
    id: policy.id,
    name: policy.name,
    base_rate: Number(policy.baseRate),
    billing_unit_minutes: policy.billingUnitMinutes,
    reservation_fee: Number(policy.reservationFee),
    deposit_required: Number(policy.depositRequired),
    late_return_cutoff: formatWallClockTime(policy.lateReturnCutoff),
    status: policy.status,
    created_at: policy.createdAt.toISOString(),
    updated_at: policy.updatedAt.toISOString(),
  };
}

export function toContractPricingPolicyDetail(args: {
  policy: PricingPolicyRow;
  usageSummary: PricingPolicyUsageSummary;
}): PricingPoliciesContracts.PricingPolicyDetail {
  return {
    ...toContractPricingPolicy(args.policy),
    usage_summary: {
      reservation_count: args.usageSummary.reservationCount,
      rental_count: args.usageSummary.rentalCount,
      billing_record_count: args.usageSummary.billingRecordCount,
      is_used: args.usageSummary.isUsed,
    },
  };
}
