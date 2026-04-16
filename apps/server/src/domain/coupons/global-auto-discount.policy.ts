import type { BillingPreviewDiscountRuleRow } from "./models";

import { toMinorUnit } from "@/domain/shared/money";

export type GlobalAutoDiscountSelection = {
  readonly rule: BillingPreviewDiscountRuleRow | null;
  readonly discountAmountMinor: bigint;
};

export function selectBestGlobalAutoDiscountRule(
  candidates: readonly BillingPreviewDiscountRuleRow[],
  eligibleRentalAmountMinor: bigint,
): GlobalAutoDiscountSelection {
  let best: BillingPreviewDiscountRuleRow | null = null;
  let bestDiscountMinor = 0n;

  for (const candidate of candidates) {
    const discountMinor = minBigInt(
      toMinorUnit(candidate.discountValue),
      eligibleRentalAmountMinor,
    );

    if (!best) {
      best = candidate;
      bestDiscountMinor = discountMinor;
      continue;
    }

    const bestPriority = best.priority ?? Number.MAX_SAFE_INTEGER;
    const candidatePriority = candidate.priority ?? Number.MAX_SAFE_INTEGER;
    const bestMinRidingMinutes = best.minRidingMinutes ?? 0;
    const candidateMinRidingMinutes = candidate.minRidingMinutes ?? 0;

    if (
      discountMinor > bestDiscountMinor
      || (discountMinor === bestDiscountMinor && candidatePriority < bestPriority)
      || (
        discountMinor === bestDiscountMinor
        && candidatePriority === bestPriority
        && candidateMinRidingMinutes > bestMinRidingMinutes
      )
      || (
        discountMinor === bestDiscountMinor
        && candidatePriority === bestPriority
        && candidateMinRidingMinutes === bestMinRidingMinutes
        && candidate.createdAt > best.createdAt
      )
    ) {
      best = candidate;
      bestDiscountMinor = discountMinor;
    }
  }

  return {
    rule: best,
    discountAmountMinor: best ? bestDiscountMinor : 0n,
  };
}

function minBigInt(left: bigint, right: bigint) {
  return left < right ? left : right;
}
