import type {
  PaymentKind,
  PaymentProvider,
  PaymentStatus,
  Prisma as PrismaTypes,
  WalletHoldReason,
  WalletHoldStatus,
  WalletStatus,
  WalletTransactionStatus,
  WalletTransactionType,
  WalletWithdrawalStatus,
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

export type WalletTransactionUserRow = {
  readonly id: string;
  readonly fullName: string;
};

export type WalletTransactionListOwnerRow = {
  readonly walletId: string;
  readonly user: WalletTransactionUserRow;
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
  readonly withdrawalId: string | null;
  readonly rentalId: string | null;
  readonly amount: bigint;
  readonly status: WalletHoldStatus;
  readonly reason: WalletHoldReason;
  readonly releasedAt: Date | null;
  readonly settledAt: Date | null;
  readonly forfeitedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateWalletHoldInput = {
  readonly walletId: string;
  readonly withdrawalId?: string | null;
  readonly rentalId?: string | null;
  readonly amount: bigint;
  readonly reason?: WalletHoldReason;
};

export type PaymentAttemptRow = {
  readonly id: string;
  readonly userId: string;
  readonly walletId: string;
  readonly provider: PaymentProvider;
  readonly providerRef: string | null;
  readonly kind: PaymentKind;
  readonly status: PaymentStatus;
  readonly amountMinor: bigint;
  readonly feeMinor: bigint;
  readonly currency: string;
  readonly failureReason: string | null;
  readonly metadata: PrismaTypes.JsonValue | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreatePaymentAttemptInput = {
  readonly userId: string;
  readonly walletId: string;
  readonly provider: PaymentProvider;
  readonly kind: PaymentKind;
  readonly amountMinor: bigint;
  readonly feeMinor?: bigint;
  readonly currency: string;
  readonly providerRef?: string | null;
  readonly metadata?: PrismaTypes.JsonValue | null;
};

export type WalletWithdrawalRow = {
  readonly id: string;
  readonly userId: string;
  readonly walletId: string;
  readonly amount: bigint;
  readonly currency: string;
  readonly payoutAmount: bigint | null;
  readonly payoutCurrency: string | null;
  readonly fxRate: bigint | null;
  readonly fxQuotedAt: Date | null;
  readonly status: WalletWithdrawalStatus;
  readonly idempotencyKey: string;
  readonly stripeTransferId: string | null;
  readonly stripePayoutId: string | null;
  readonly failureReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateWalletWithdrawalInput = {
  readonly userId: string;
  readonly walletId: string;
  readonly amount: bigint;
  readonly currency: string;
  readonly payoutAmount?: bigint | null;
  readonly payoutCurrency?: string | null;
  readonly fxRate?: bigint | null;
  readonly fxQuotedAt?: Date | null;
  readonly idempotencyKey: string;
};

export type MarkWithdrawalProcessingInput = {
  readonly withdrawalId: string;
  readonly stripeTransferId?: string | null;
  readonly stripePayoutId?: string | null;
  readonly staleBefore?: Date;
};

export type MarkWithdrawalResultInput = {
  readonly withdrawalId: string;
  readonly stripePayoutId?: string | null;
  readonly failureReason?: string | null;
};

export type UpdateWithdrawalStripeRefsInput = {
  readonly withdrawalId: string;
  readonly stripeTransferId?: string | null;
  readonly stripePayoutId?: string | null;
};
