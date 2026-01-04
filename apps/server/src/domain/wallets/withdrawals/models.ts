import type { WalletWithdrawalStatus } from "generated/prisma/client";

export type WalletWithdrawalRow = {
  readonly id: string;
  readonly userId: string;
  readonly walletId: string;
  readonly amount: bigint;
  readonly currency: string;
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
