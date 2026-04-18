import type {
  CouponTriggerType,
  DiscountType,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { toMinorUnit } from "@/domain/shared/money";

import type { CouponRuleSnapshot } from "./models";

export type CouponRuleIdentity = {
  readonly ruleId: string;
  readonly name: string;
  readonly triggerType: "RIDING_DURATION";
  readonly minRidingMinutes: number | null;
  readonly discountType: "FIXED_AMOUNT";
  readonly discountValue: number;
  readonly source: "BILLING_RECORD_RULE" | "BILLING_RECORD_SNAPSHOT";
};

type CouponRuleReference = {
  readonly id: string;
  readonly name: string;
  readonly triggerType: CouponTriggerType;
  readonly minRidingMinutes: number | null;
  readonly discountType: DiscountType;
  readonly discountValue: PrismaTypes.Decimal;
};

export function readCouponRuleIdentity(input: {
  readonly couponRuleSnapshot: PrismaTypes.JsonValue | null;
  readonly couponRule?: CouponRuleReference | null;
}): CouponRuleIdentity | null {
  const snapshot = readCouponRuleSnapshot(input.couponRuleSnapshot);
  if (snapshot) {
    return {
      ruleId: snapshot.ruleId,
      name: snapshot.name,
      triggerType: snapshot.triggerType,
      minRidingMinutes: snapshot.minRidingMinutes,
      discountType: snapshot.discountType,
      discountValue: snapshot.discountValue,
      source: "BILLING_RECORD_SNAPSHOT",
    };
  }

  if (
    input.couponRule
    && input.couponRule.triggerType === "RIDING_DURATION"
    && input.couponRule.discountType === "FIXED_AMOUNT"
  ) {
    return {
      ruleId: input.couponRule.id,
      name: input.couponRule.name,
      triggerType: input.couponRule.triggerType,
      minRidingMinutes: input.couponRule.minRidingMinutes,
      discountType: input.couponRule.discountType,
      discountValue: Number(toMinorUnit(input.couponRule.discountValue)),
      source: "BILLING_RECORD_RULE",
    };
  }

  return null;
}

export function readCouponRuleSnapshot(
  value: PrismaTypes.JsonValue | null,
): CouponRuleSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const snapshot = value as Record<string, unknown>;
  if (
    typeof snapshot.ruleId !== "string"
    || typeof snapshot.name !== "string"
    || snapshot.triggerType !== "RIDING_DURATION"
    || typeof snapshot.minRidingMinutes !== "number"
    || snapshot.discountType !== "FIXED_AMOUNT"
    || typeof snapshot.discountValue !== "number"
    || typeof snapshot.priority !== "number"
    || typeof snapshot.billableMinutes !== "number"
    || typeof snapshot.billableHours !== "number"
    || typeof snapshot.appliedAt !== "string"
  ) {
    return null;
  }

  return {
    ruleId: snapshot.ruleId,
    name: snapshot.name,
    triggerType: snapshot.triggerType,
    minRidingMinutes: snapshot.minRidingMinutes,
    discountType: snapshot.discountType,
    discountValue: snapshot.discountValue,
    priority: snapshot.priority,
    billableMinutes: snapshot.billableMinutes,
    billableHours: snapshot.billableHours,
    appliedAt: snapshot.appliedAt,
  };
}
