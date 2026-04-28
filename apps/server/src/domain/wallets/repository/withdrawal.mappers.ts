import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { WalletWithdrawalRow } from "../models";

export const selectWithdrawalRow = {
  id: true,
  userId: true,
  walletId: true,
  amount: true,
  currency: true,
  payoutAmount: true,
  payoutCurrency: true,
  fxRate: true,
  fxQuotedAt: true,
  status: true,
  idempotencyKey: true,
  stripeTransferId: true,
  stripePayoutId: true,
  failureReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.WalletWithdrawalSelect;

export function toWithdrawalRow(
  row: PrismaTypes.WalletWithdrawalGetPayload<{ select: typeof selectWithdrawalRow }>,
): WalletWithdrawalRow {
  return {
    id: row.id,
    userId: row.userId,
    walletId: row.walletId,
    amount: row.amount,
    currency: row.currency,
    payoutAmount: row.payoutAmount,
    payoutCurrency: row.payoutCurrency,
    fxRate: row.fxRate,
    fxQuotedAt: row.fxQuotedAt,
    status: row.status,
    idempotencyKey: row.idempotencyKey,
    stripeTransferId: row.stripeTransferId,
    stripePayoutId: row.stripePayoutId,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
