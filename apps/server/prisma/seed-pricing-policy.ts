import type { PrismaClient } from "../generated/prisma/client";

export const DEFAULT_PRICING_POLICY_ID = "11111111-1111-4111-8111-111111111111";

export async function seedDefaultPricingPolicy(prisma: PrismaClient): Promise<void> {
  await prisma.pricingPolicy.upsert({
    where: { id: DEFAULT_PRICING_POLICY_ID },
    update: {
      name: "Default Pricing Policy",
      baseRate: 2000n,
      billingUnitMinutes: 30,
      reservationFee: 2000n,
      depositRequired: 500000n,
      lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
      status: "ACTIVE",
    },
    create: {
      id: DEFAULT_PRICING_POLICY_ID,
      name: "Default Pricing Policy",
      baseRate: 2000n,
      billingUnitMinutes: 30,
      reservationFee: 2000n,
      depositRequired: 500000n,
      lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
      status: "ACTIVE",
    },
  });
}
