import { describe, expect, it } from "vitest";

import { toPrismaDecimal } from "@/domain/shared/decimal";

import type { PricingPolicyRow } from "../models";

import {
  calculateUsageChargeMinor,
  getDepositRequiredMinor,
  getReservationFeeMinor,
} from "../calculator";

function makePolicy(overrides: Partial<PricingPolicyRow> = {}): PricingPolicyRow {
  return {
    id: "policy-a",
    name: "Policy A",
    baseRate: toPrismaDecimal("2000"),
    billingUnitMinutes: 30,
    overtimeRate: null,
    reservationFee: toPrismaDecimal("3000"),
    depositRequired: toPrismaDecimal("500000"),
    lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
    status: "ACTIVE",
    activeFrom: null,
    activeTo: null,
    createdAt: new Date("2026-03-22T00:00:00.000Z"),
    updatedAt: new Date("2026-03-22T00:00:00.000Z"),
    ...overrides,
  };
}

describe("pricing calculator", () => {
  it("returns reservation fee in minor units", () => {
    const policy = makePolicy({ reservationFee: toPrismaDecimal("4000") });

    expect(getReservationFeeMinor(policy)).toBe(4000n);
  });

  it("returns deposit required in minor units", () => {
    const policy = makePolicy({ depositRequired: toPrismaDecimal("250000") });

    expect(getDepositRequiredMinor(policy)).toBe(250000n);
  });

  it("rounds usage up to the billing unit", () => {
    const policy = makePolicy({
      baseRate: toPrismaDecimal("2000"),
      billingUnitMinutes: 30,
    });

    expect(calculateUsageChargeMinor({ durationMinutes: 31, policy })).toBe(4000n);
  });

  it("charges at least one billing unit", () => {
    const policy = makePolicy({
      baseRate: toPrismaDecimal("1500"),
      billingUnitMinutes: 30,
    });

    expect(calculateUsageChargeMinor({ durationMinutes: 0, policy })).toBe(1500n);
  });

  it("guards against invalid zero billing unit minutes", () => {
    const policy = makePolicy({
      baseRate: toPrismaDecimal("2000"),
      billingUnitMinutes: 0,
    });

    expect(calculateUsageChargeMinor({ durationMinutes: 3, policy })).toBe(6000n);
  });
});
