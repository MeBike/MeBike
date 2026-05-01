import { describe, expect, it } from "vitest";

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
    baseRate: 2000n,
    billingUnitMinutes: 30,
    reservationFee: 3000n,
    depositRequired: 500000n,
    lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
    status: "ACTIVE",
    createdAt: new Date("2026-03-22T00:00:00.000Z"),
    updatedAt: new Date("2026-03-22T00:00:00.000Z"),
    ...overrides,
  };
}

describe("pricing calculator", () => {
  it("returns reservation fee in minor units", () => {
    const policy = makePolicy({ reservationFee: 4000n });

    expect(getReservationFeeMinor(policy)).toBe(4000n);
  });

  it("returns deposit required in minor units", () => {
    const policy = makePolicy({ depositRequired: 250000n });

    expect(getDepositRequiredMinor(policy)).toBe(250000n);
  });

  it("rounds usage up to the billing unit", () => {
    const policy = makePolicy({
      baseRate: 2000n,
      billingUnitMinutes: 30,
    });

    expect(calculateUsageChargeMinor({ durationMinutes: 31, policy })).toBe(4000n);
  });

  it("charges at least one billing unit", () => {
    const policy = makePolicy({
      baseRate: 1500n,
      billingUnitMinutes: 30,
    });

    expect(calculateUsageChargeMinor({ durationMinutes: 0, policy })).toBe(1500n);
  });

  it("guards against invalid zero billing unit minutes", () => {
    const policy = makePolicy({
      baseRate: 2000n,
      billingUnitMinutes: 0,
    });

    expect(calculateUsageChargeMinor({ durationMinutes: 3, policy })).toBe(6000n);
  });
});
