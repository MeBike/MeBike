import { Context, Effect, Layer, Option } from "effect";

import type { PaymentProvider, PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { getPrismaUniqueViolationTarget, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { CreatePaymentAttemptInput, PaymentAttemptRow } from "../models";

import { PaymentAttemptRepositoryError, PaymentAttemptUniqueViolation } from "../domain-errors";

const selectPaymentAttemptRow = {
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

function toPaymentAttemptRow(row: PrismaTypes.PaymentAttemptGetPayload<{ select: typeof selectPaymentAttemptRow }>): PaymentAttemptRow {
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

export type PaymentAttemptRepositoryType = {
  create: (input: CreatePaymentAttemptInput) => Effect.Effect<
    PaymentAttemptRow,
    PaymentAttemptRepositoryError | PaymentAttemptUniqueViolation
  >;
  findById: (id: string) => Effect.Effect<Option.Option<PaymentAttemptRow>, PaymentAttemptRepositoryError>;
  findByProviderRef: (
    provider: PaymentProvider,
    providerRef: string,
  ) => Effect.Effect<Option.Option<PaymentAttemptRow>, PaymentAttemptRepositoryError>;
  setProviderRef: (
    id: string,
    providerRef: string,
  ) => Effect.Effect<PaymentAttemptRow, PaymentAttemptRepositoryError | PaymentAttemptUniqueViolation>;
  markSucceededIfPendingInTx: (
    tx: PrismaTypes.TransactionClient,
    id: string,
    providerRef: string,
  ) => Effect.Effect<boolean, PaymentAttemptRepositoryError>;
  markFailedIfPendingInTx: (
    tx: PrismaTypes.TransactionClient,
    id: string,
    failureReason: string,
  ) => Effect.Effect<boolean, PaymentAttemptRepositoryError>;
};

export class PaymentAttemptRepository extends Context.Tag("PaymentAttemptRepository")<
  PaymentAttemptRepository,
  PaymentAttemptRepositoryType
>() {}

export function makePaymentAttemptRepository(client: PrismaClient): PaymentAttemptRepositoryType {
  return {
    create: input =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.paymentAttempt.create({
            data: {
              userId: input.userId,
              walletId: input.walletId,
              provider: input.provider,
              providerRef: input.providerRef ?? null,
              kind: input.kind,
              status: "PENDING",
              amountMinor: input.amountMinor,
              feeMinor: input.feeMinor ?? 0n,
              currency: input.currency,
              metadata: input.metadata ?? undefined,
            },
            select: selectPaymentAttemptRow,
          });
          return toPaymentAttemptRow(row);
        },
        catch: (err) => {
          if (isPrismaUniqueViolation(err)) {
            return new PaymentAttemptUniqueViolation({
              operation: "create",
              constraint: getPrismaUniqueViolationTarget(err),
              cause: err,
            });
          }
          return new PaymentAttemptRepositoryError({
            operation: "create",
            cause: err,
          });
        },
      }),

    findById: id =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.paymentAttempt.findUnique({
            where: { id },
            select: selectPaymentAttemptRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toPaymentAttemptRow));
        },
        catch: err =>
          new PaymentAttemptRepositoryError({
            operation: "findById",
            cause: err,
          }),
      }),

    findByProviderRef: (provider, providerRef) =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.paymentAttempt.findFirst({
            where: { provider, providerRef },
            select: selectPaymentAttemptRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toPaymentAttemptRow));
        },
        catch: err =>
          new PaymentAttemptRepositoryError({
            operation: "findByProviderRef",
            cause: err,
          }),
      }),

    setProviderRef: (id, providerRef) =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.paymentAttempt.update({
            where: { id },
            data: { providerRef },
            select: selectPaymentAttemptRow,
          });
          return toPaymentAttemptRow(row);
        },
        catch: (err) => {
          if (isPrismaUniqueViolation(err)) {
            return new PaymentAttemptUniqueViolation({
              operation: "setProviderRef",
              constraint: getPrismaUniqueViolationTarget(err),
              cause: err,
            });
          }
          return new PaymentAttemptRepositoryError({
            operation: "setProviderRef",
            cause: err,
          });
        },
      }),

    markSucceededIfPendingInTx: (tx, id, providerRef) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.paymentAttempt.updateMany({
            where: { id, status: "PENDING" },
            data: {
              status: "SUCCEEDED",
              providerRef,
              failureReason: null,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new PaymentAttemptRepositoryError({
            operation: "markSucceededIfPendingInTx",
            cause: err,
          }),
      }),

    markFailedIfPendingInTx: (tx, id, failureReason) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.paymentAttempt.updateMany({
            where: { id, status: "PENDING" },
            data: {
              status: "FAILED",
              failureReason,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new PaymentAttemptRepositoryError({
            operation: "markFailedIfPendingInTx",
            cause: err,
          }),
      }),
  };
}

export const PaymentAttemptRepositoryLive = Layer.effect(
  PaymentAttemptRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makePaymentAttemptRepository(client);
  }),
);
