import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { PaymentAttemptRow } from "../models";

export const selectPaymentAttemptRow = {
  id: true,
  userId: true,
  walletId: true,
  provider: true,
  providerRef: true,
  kind: true,
  status: true,
  amountMinor: true,
  feeMinor: true,
  currency: true,
  failureReason: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.PaymentAttemptSelect;

export function toPaymentAttemptRow(
  row: PrismaTypes.PaymentAttemptGetPayload<{ select: typeof selectPaymentAttemptRow }>,
): PaymentAttemptRow {
  return {
    id: row.id,
    userId: row.userId,
    walletId: row.walletId,
    provider: row.provider,
    providerRef: row.providerRef,
    kind: row.kind,
    status: row.status,
    amountMinor: row.amountMinor,
    feeMinor: row.feeMinor,
    currency: row.currency,
    failureReason: row.failureReason,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
