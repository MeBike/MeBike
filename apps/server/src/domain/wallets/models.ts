import type { Prisma as PrismaTypes, WalletStatus, WalletTransactionStatus, WalletTransactionType } from "generated/prisma/client";

export type WalletDecimal = PrismaTypes.Decimal;

export type WalletRow = {
  readonly id: string;
  readonly userId: string;
  readonly balance: WalletDecimal;
  readonly status: WalletStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type WalletTransactionRow = {
  readonly id: string;
  readonly walletId: string;
  readonly amount: WalletDecimal;
  readonly fee: WalletDecimal;
  readonly description: string | null;
  readonly hash: string | null;
  readonly type: WalletTransactionType;
  readonly status: WalletTransactionStatus;
  readonly createdAt: Date;
};

export type IncreaseBalanceInput = {
  readonly userId: string;
  readonly amount: WalletDecimal;
  readonly fee?: WalletDecimal;
  readonly description?: string | null;
  readonly hash?: string | null;
  readonly type?: WalletTransactionType; // default DEPOSIT
};

export type DecreaseBalanceInput = {
  readonly userId: string;
  readonly amount: WalletDecimal;
  readonly description?: string | null;
  readonly hash?: string | null;
  readonly type?: WalletTransactionType; // default DEBIT
};
