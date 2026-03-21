import type { PrismaClient } from "generated/prisma/client";

export async function resetTestData(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuthEvent",
      "BikeSwapRequest",
      "FixedSlotDate",
      "FixedSlotTemplate",
      "rating_reason_links",
      "rating_reasons",
      "ratings",
      "Rental",
      "Reservation",
      "Subscription",
      "push_tokens",
      "payment_attempts",
      "wallet_transactions",
      "wallet_withdrawals",
      "wallet_holds",
      "wallets",
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
