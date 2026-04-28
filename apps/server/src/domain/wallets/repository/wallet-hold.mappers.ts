import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { WalletHoldRow } from "../models";

export const selectWalletHoldRow = {
  id: true,
  walletId: true,
  withdrawalId: true,
  rentalId: true,
  amount: true,
  status: true,
  reason: true,
  releasedAt: true,
  settledAt: true,
  forfeitedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.WalletHoldSelect;

export function toWalletHoldRow(
  row: PrismaTypes.WalletHoldGetPayload<{ select: typeof selectWalletHoldRow }>,
): WalletHoldRow {
  return {
    id: row.id,
    walletId: row.walletId,
    withdrawalId: row.withdrawalId,
    rentalId: row.rentalId,
    amount: row.amount,
    status: row.status,
    reason: row.reason,
    releasedAt: row.releasedAt,
    settledAt: row.settledAt,
    forfeitedAt: row.forfeitedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
