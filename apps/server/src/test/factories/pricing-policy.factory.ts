import { uuidv7 } from "uuidv7";

import { toPrismaDecimal } from "@/domain/shared/decimal";

import type { CreatedPricingPolicy, FactoryContext, PricingPolicyOverrides } from "./types";

const defaults = {
  name: "Test Pricing Policy",
  baseRate: "2000",
  billingUnitMinutes: 30,
  overtimeRate: null,
  reservationFee: "2000",
  depositRequired: "500000",
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
        baseRate: toPrismaDecimal(overrides.baseRate ?? defaults.baseRate),
        billingUnitMinutes: overrides.billingUnitMinutes ?? defaults.billingUnitMinutes,
        overtimeRate: overrides.overtimeRate == null ? null : toPrismaDecimal(overrides.overtimeRate),
        reservationFee: toPrismaDecimal(overrides.reservationFee ?? defaults.reservationFee),
        depositRequired: toPrismaDecimal(overrides.depositRequired ?? defaults.depositRequired),
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
