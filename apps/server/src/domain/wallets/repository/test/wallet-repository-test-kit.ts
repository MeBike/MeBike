import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { makeWalletCommandRepository } from "../wallet-command.repository";
import { makeWalletQueryRepository } from "../wallet-query.repository";

/**
 * Compose wallet query và command repositories cho các integration test cũ.
 *
 * Production code không dùng helper này để tránh nhập nhằng read/write boundary.
 *
 * @param client Prisma client hoặc transaction client đang dùng trong test.
 */
export function makeWalletTestRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
) {
  return {
    ...makeWalletQueryRepository(client),
    ...makeWalletCommandRepository(client),
  };
}

export type WalletTestRepository = ReturnType<typeof makeWalletTestRepository>;
