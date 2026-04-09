import type { PrismaClient } from "generated/prisma/client";

import { toPrismaDecimal } from "@/domain/shared/decimal";

const DEFAULT_PRICING_POLICY_ID = "11111111-1111-4111-8111-111111111111";

export async function seedDefaultPricingPolicy(prisma: PrismaClient): Promise<void> {
  await prisma.pricingPolicy.upsert({
    where: { id: DEFAULT_PRICING_POLICY_ID },
    update: {
      name: "Default Pricing Policy",
      baseRate: toPrismaDecimal("2000"),
      billingUnitMinutes: 30,
      overtimeRate: null,
      reservationFee: toPrismaDecimal("2000"),
      depositRequired: toPrismaDecimal("500000"),
      lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
      status: "ACTIVE",
    },
    create: {
      id: DEFAULT_PRICING_POLICY_ID,
      name: "Default Pricing Policy",
      baseRate: toPrismaDecimal("2000"),
      billingUnitMinutes: 30,
      overtimeRate: null,
      reservationFee: toPrismaDecimal("2000"),
      depositRequired: toPrismaDecimal("500000"),
      lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
      status: "ACTIVE",
    },
  });
}
