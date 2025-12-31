import type { PaymentKind, PaymentProvider, PaymentStatus, Prisma as PrismaTypes } from "generated/prisma/client";

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
