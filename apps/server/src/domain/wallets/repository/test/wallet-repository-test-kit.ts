import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { makeWalletCommandRepository } from "../wallet-command.repository";
import { makeWalletQueryRepository } from "../wallet-query.repository";

export function makeWalletTestRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
) {
  return {
    ...makeWalletQueryRepository(client),
    ...makeWalletCommandRepository(client),
  };
}

export type WalletTestRepository = ReturnType<typeof makeWalletTestRepository>;
