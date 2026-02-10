import type { WalletsContracts } from "@mebike/shared";

import type { WalletRow, WalletTransactionRow } from "@/domain/wallets";
import type { WalletWithdrawalRow } from "@/domain/wallets/withdrawals";

export function toWalletDetail(row: WalletRow): WalletsContracts.WalletDetail {
  return {
    id: row.id,
    userId: row.userId,
    balance: row.balance.toString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toWalletTransactionDetail(
  row: WalletTransactionRow,
): WalletsContracts.WalletTransactionDetail {
  return {
    id: row.id,
    walletId: row.walletId,
    amount: row.amount.toString(),
    fee: row.fee.toString(),
    description: row.description,
    hash: row.hash,
    type: row.type,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toWalletWithdrawalDetail(
  row: WalletWithdrawalRow,
): WalletsContracts.WalletWithdrawalDetail {
  return {
    id: row.id,
    userId: row.userId,
    walletId: row.walletId,
    amount: row.amount.toString(),
    currency: "usd",
    status: row.status,
    idempotencyKey: row.idempotencyKey,
    stripeTransferId: row.stripeTransferId,
    stripePayoutId: row.stripePayoutId,
    failureReason: row.failureReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
