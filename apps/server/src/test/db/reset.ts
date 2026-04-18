import type { PrismaClient } from "generated/prisma/client";

export async function resetTestData(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "job_outbox",
      "AuthEvent",
      "BikeSwapRequest",
      "FixedSlotDate",
      "FixedSlotTemplate",
      "rating_reason_links",
      "rating_reasons",
      "ratings",
      "environmental_impact_stats",
      "environmental_impact_policies",
      "rental_billing_records",
      "Rental",
      "Reservation",
      "pricing_policies",
      "Subscription",
      "push_tokens",
      "payment_attempts",
      "wallet_transactions",
      "wallet_withdrawals",
      "wallet_holds",
      "wallets",
      "user_coupons",
      "coupons",
      "coupon_rules",
      "UserOrgAssignment",
      "TechnicianTeam",
      "Agency",
      "Bike",
      "Station",
      "Supplier",
      "users"
    CASCADE
  `);
}
