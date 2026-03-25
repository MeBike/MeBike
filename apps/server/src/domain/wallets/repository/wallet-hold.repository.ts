import { Context, Effect, Layer, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { CreateWalletHoldInput, WalletHoldRow } from "../models";

import { WalletHoldRepositoryError } from "../domain-errors";

const selectWalletHoldRow = {
  id: true,
  walletId: true,
  withdrawalId: true,
  rentalId: true,
  amount: true,
  status: true,
  reason: true,
  releasedAt: true,
  settledAt: true,
  forfeitedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.WalletHoldSelect;

function toWalletHoldRow(
  row: PrismaTypes.WalletHoldGetPayload<{ select: typeof selectWalletHoldRow }>,
): WalletHoldRow {
  return {
    id: row.id,
    walletId: row.walletId,
    withdrawalId: row.withdrawalId,
    rentalId: row.rentalId,
    amount: row.amount,
    status: row.status,
    reason: row.reason,
    releasedAt: row.releasedAt,
    settledAt: row.settledAt,
    forfeitedAt: row.forfeitedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type WalletHoldRepo = {
  create: (
    input: CreateWalletHoldInput,
  ) => Effect.Effect<WalletHoldRow, WalletHoldRepositoryError>;
  findById: (
    holdId: string,
  ) => Effect.Effect<Option.Option<WalletHoldRow>, WalletHoldRepositoryError>;
  findByWithdrawalId: (
    withdrawalId: string,
  ) => Effect.Effect<Option.Option<WalletHoldRow>, WalletHoldRepositoryError>;
  findActiveByRentalId: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<WalletHoldRow>, WalletHoldRepositoryError>;
  sumActiveAmountByWallet: (
    walletId: string,
  ) => Effect.Effect<bigint, WalletHoldRepositoryError>;
  releaseById: (
    holdId: string,
    releasedAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
  releaseByWithdrawalId: (
    withdrawalId: string,
    releasedAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
  settleById: (
    holdId: string,
    settledAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
  forfeitById: (
    holdId: string,
    forfeitedAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
  settleByWithdrawalId: (
    withdrawalId: string,
    settledAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
};

export class WalletHoldRepository extends Context.Tag("WalletHoldRepository")<
  WalletHoldRepository,
  WalletHoldRepo
>() {}

export function makeWalletHoldRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): WalletHoldRepo {
  return {
    create: input =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletHold.create({
            data: {
              walletId: input.walletId,
              withdrawalId: input.withdrawalId ?? null,
              rentalId: input.rentalId ?? null,
              amount: input.amount,
              status: "ACTIVE",
              reason: input.reason ?? "WITHDRAWAL",
            },
            select: selectWalletHoldRow,
          });
          return toWalletHoldRow(row);
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "create",
            cause: err,
          }),
      }),

    findById: holdId =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletHold.findUnique({
            where: { id: holdId },
            select: selectWalletHoldRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWalletHoldRow));
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "findById",
            cause: err,
          }),
      }),

    findByWithdrawalId: withdrawalId =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletHold.findUnique({
            where: { withdrawalId },
            select: selectWalletHoldRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWalletHoldRow));
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "findByWithdrawalId",
            cause: err,
          }),
      }),

    findActiveByRentalId: rentalId =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.walletHold.findFirst({
            where: {
              rentalId,
              status: "ACTIVE",
              reason: "RENTAL_DEPOSIT",
            },
            orderBy: { createdAt: "desc" },
            select: selectWalletHoldRow,
          });
          return Option.fromNullable(row).pipe(Option.map(toWalletHoldRow));
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "findActiveByRentalId",
            cause: err,
          }),
      }),

    sumActiveAmountByWallet: walletId =>
      Effect.tryPromise({
        try: async () => {
          const result = await client.walletHold.aggregate({
            where: { walletId, status: "ACTIVE" },
            _sum: { amount: true },
          });
          return result._sum.amount ?? 0n;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "sumActiveAmountByWallet",
            cause: err,
          }),
      }),

    releaseByWithdrawalId: (withdrawalId, releasedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletHold.updateMany({
            where: { withdrawalId, status: "ACTIVE" },
            data: {
              status: "RELEASED",
              releasedAt,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "releaseByWithdrawalId",
            cause: err,
          }),
      }),

    releaseById: (holdId, releasedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletHold.updateMany({
            where: { id: holdId, status: "ACTIVE" },
            data: {
              status: "RELEASED",
              releasedAt,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "releaseById",
            cause: err,
          }),
      }),

    settleByWithdrawalId: (withdrawalId, settledAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletHold.updateMany({
            where: { withdrawalId, status: "ACTIVE" },
            data: {
              status: "SETTLED",
              settledAt,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "settleByWithdrawalId",
            cause: err,
          }),
      }),

    settleById: (holdId, settledAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletHold.updateMany({
            where: { id: holdId, status: "ACTIVE" },
            data: {
              status: "SETTLED",
              settledAt,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "settleById",
            cause: err,
          }),
      }),

    forfeitById: (holdId, forfeitedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.walletHold.updateMany({
            where: { id: holdId, status: "ACTIVE" },
            data: {
              status: "SETTLED",
              settledAt: forfeitedAt,
              forfeitedAt,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new WalletHoldRepositoryError({
            operation: "forfeitById",
            cause: err,
          }),
      }),

  };
}

export const WalletHoldRepositoryLive = Layer.effect(
  WalletHoldRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeWalletHoldRepository(client);
  }),
);
