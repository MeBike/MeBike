import { uuidv7 } from "uuidv7";

import { toMinorUnit } from "@/domain/shared/money";

import type { CreatedPricingPolicy, FactoryContext, PricingPolicyOverrides } from "./types";

const defaults = {
  name: "Test Pricing Policy",
  baseRate: 2000n,
  billingUnitMinutes: 30,
  reservationFee: 2000n,
  depositRequired: 500000n,
  lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
  status: "ACTIVE" as const,
};

export function createPricingPolicyFactory(ctx: FactoryContext) {
  return async (overrides: PricingPolicyOverrides = {}): Promise<CreatedPricingPolicy> => {
    const id = overrides.id ?? uuidv7();
    const created = await ctx.prisma.pricingPolicy.create({
      data: {
        id,
        name: overrides.name ?? defaults.name,
        baseRate: toMinorUnit(overrides.baseRate ?? defaults.baseRate),
        billingUnitMinutes: overrides.billingUnitMinutes ?? defaults.billingUnitMinutes,
        reservationFee: toMinorUnit(overrides.reservationFee ?? defaults.reservationFee),
        depositRequired: toMinorUnit(overrides.depositRequired ?? defaults.depositRequired),
        lateReturnCutoff: overrides.lateReturnCutoff ?? defaults.lateReturnCutoff,
        status: overrides.status ?? defaults.status,
      },
    });

    return {
      id: created.id,
      name: created.name,
    };
  };
}

export type PricingPolicyFactory = ReturnType<typeof createPricingPolicyFactory>;
