import type {
  WalletHoldReason,
  WalletHoldStatus,
  WalletStatus,
  WalletTransactionStatus,
  WalletTransactionType,
} from "generated/prisma/client";

export type WalletRow = {
  readonly id: string;
  readonly userId: string;
  readonly balance: bigint;
  readonly reservedBalance: bigint;
  readonly status: WalletStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type WalletTransactionRow = {
  readonly id: string;
  readonly walletId: string;
  readonly amount: bigint;
  readonly fee: bigint;
  readonly description: string | null;
  readonly hash: string | null;
  readonly type: WalletTransactionType;
  readonly status: WalletTransactionStatus;
  readonly createdAt: Date;
};

export type IncreaseBalanceInput = {
  readonly userId: string;
  readonly amount: bigint;
  readonly fee?: bigint;
  readonly description?: string | null;
  readonly hash?: string | null;
  readonly type?: WalletTransactionType; // default DEPOSIT
};

export type DecreaseBalanceInput = {
  readonly userId: string;
  readonly amount: bigint;
  readonly description?: string | null;
  readonly hash?: string | null;
  readonly type?: WalletTransactionType; // default DEBIT
};

export type WalletHoldRow = {
  readonly id: string;
  readonly walletId: string;
  readonly withdrawalId: string;
  readonly amount: bigint;
  readonly status: WalletHoldStatus;
  readonly reason: WalletHoldReason;
  readonly releasedAt: Date | null;
  readonly settledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateWalletHoldInput = {
  readonly walletId: string;
  readonly withdrawalId: string;
  readonly amount: bigint;
  readonly reason?: WalletHoldReason;
};
