import { Context, Effect, Layer, Option } from "effect";

import type { PaymentProvider, PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { getPrismaUniqueViolationTarget, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { CreatePaymentAttemptInput, PaymentAttemptRow } from "../models";

import { PaymentAttemptRepositoryError, PaymentAttemptUniqueViolation } from "../domain-errors";
import { selectPaymentAttemptRow, toPaymentAttemptRow } from "./payment-attempt.mappers";

export type PaymentAttemptRepositoryType = {
  create: (input: CreatePaymentAttemptInput) => Effect.Effect<
    PaymentAttemptRow,
    PaymentAttemptUniqueViolation
  >;
  findById: (id: string) => Effect.Effect<Option.Option<PaymentAttemptRow>>;
  findByProviderRef: (
    provider: PaymentProvider,
    providerRef: string,
  ) => Effect.Effect<Option.Option<PaymentAttemptRow>>;
  findPendingTopupsBefore: (
    createdBefore: Date,
    limit: number,
  ) => Effect.Effect<ReadonlyArray<PaymentAttemptRow>>;
  setProviderRef: (
    id: string,
    providerRef: string,
  ) => Effect.Effect<PaymentAttemptRow, PaymentAttemptUniqueViolation>;
  markSucceededIfPending: (
    id: string,
    providerRef: string,
  ) => Effect.Effect<boolean>;
  markFailedIfPending: (
    id: string,
    failureReason: string,
  ) => Effect.Effect<boolean>;
};

export class PaymentAttemptRepository extends Context.Tag("PaymentAttemptRepository")<
  PaymentAttemptRepository,
  PaymentAttemptRepositoryType
>() {}

export function makePaymentAttemptRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): PaymentAttemptRepositoryType {
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
      }).pipe(defectOn(PaymentAttemptRepositoryError)),

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
      }).pipe(defectOn(PaymentAttemptRepositoryError)),

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
      }).pipe(defectOn(PaymentAttemptRepositoryError)),

    findPendingTopupsBefore: (createdBefore, limit) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await client.paymentAttempt.findMany({
            where: {
              provider: "STRIPE",
              kind: "TOPUP",
              status: "PENDING",
              createdAt: { lte: createdBefore },
            },
            orderBy: { createdAt: "asc" },
            take: limit,
            select: selectPaymentAttemptRow,
          });
          return rows.map(toPaymentAttemptRow);
        },
        catch: err =>
          new PaymentAttemptRepositoryError({
            operation: "findPendingTopupsBefore",
            cause: err,
          }),
      }).pipe(defectOn(PaymentAttemptRepositoryError)),

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
      }).pipe(defectOn(PaymentAttemptRepositoryError)),

    markSucceededIfPending: (id, providerRef) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.paymentAttempt.updateMany({
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
            operation: "markSucceededIfPending",
            cause: err,
          }),
      }).pipe(defectOn(PaymentAttemptRepositoryError)),

    markFailedIfPending: (id, failureReason) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.paymentAttempt.updateMany({
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
            operation: "markFailedIfPending",
            cause: err,
          }),
      }).pipe(defectOn(PaymentAttemptRepositoryError)),

  };
}

export const PaymentAttemptRepositoryLive = Layer.effect(
  PaymentAttemptRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makePaymentAttemptRepository(client);
  }),
);
