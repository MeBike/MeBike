import { toMinorUnit } from "@/domain/shared/money";

import type { PricingPolicyRow } from "./models";

export function getReservationFeeMinor(policy: PricingPolicyRow): bigint {
  return toMinorUnit(policy.reservationFee);
}

export function getDepositRequiredMinor(policy: PricingPolicyRow): bigint {
  return toMinorUnit(policy.depositRequired);
}

export function calculateUsageChargeMinor(args: {
  readonly durationMinutes: number;
  readonly policy: PricingPolicyRow;
}): bigint {
  const billingUnitMinutes = Math.max(1, args.policy.billingUnitMinutes);
  const billedUnits = Math.max(1, Math.ceil(args.durationMinutes / billingUnitMinutes));
  return BigInt(billedUnits) * toMinorUnit(args.policy.baseRate);
}
