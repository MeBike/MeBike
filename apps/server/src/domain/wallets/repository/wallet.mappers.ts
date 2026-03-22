import type { Wallet, WalletTransaction } from "generated/prisma/client";

import type {
  WalletRow,
  WalletTransactionListOwnerRow,
  WalletTransactionRow,
} from "../models";

export const selectWalletRow = {
  id: true,
  userId: true,
  balance: true,
  reservedBalance: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const selectWalletTransactionRow = {
  id: true,
  walletId: true,
  amount: true,
  fee: true,
  description: true,
  hash: true,
  type: true,
  status: true,
  createdAt: true,
} as const;

export const selectWalletTransactionListOwnerRow = {
  id: true,
  user: {
    select: {
      id: true,
      fullName: true,
    },
  },
} as const;

export function toWalletRow(row: Wallet): WalletRow {
  return {
    id: row.id,
    userId: row.userId,
    balance: row.balance,
    reservedBalance: row.reservedBalance,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toWalletTransactionRow(row: WalletTransaction): WalletTransactionRow {
  return {
    id: row.id,
    walletId: row.walletId,
    amount: row.amount,
    fee: row.fee,
    description: row.description,
    hash: row.hash,
    type: row.type,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export function toWalletTransactionListOwnerRow(
  row: {
    id: string;
    user: {
      id: string;
      fullName: string;
    };
  },
): WalletTransactionListOwnerRow {
  return {
    walletId: row.id,
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
    },
  };
}
