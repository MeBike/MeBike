import type { PrismaClient } from "generated/prisma/client";

export async function resetTestData(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuthEvent",
      "BikeSwapRequest",
      "FixedSlotDate",
      "FixedSlotTemplate",
      "Rating",
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
      "User"
    CASCADE
  `);
}
