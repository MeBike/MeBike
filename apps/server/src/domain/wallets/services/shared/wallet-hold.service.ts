import type { Option } from "effect";

import { Context, Effect, Layer } from "effect";

import type { CreateWalletHoldInput, WalletHoldRow } from "../../models";

import { makeWalletHoldRepository, WalletHoldRepository } from "../../repository/wallet-hold.repository";

export type WalletHoldService = {
  createInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: CreateWalletHoldInput,
  ) => Effect.Effect<WalletHoldRow>;
  findByIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    holdId: string,
  ) => Effect.Effect<Option.Option<WalletHoldRow>>;
  findByWithdrawalIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    withdrawalId: string,
  ) => Effect.Effect<Option.Option<WalletHoldRow>>;
  findActiveByRentalIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    rentalId: string,
  ) => Effect.Effect<Option.Option<WalletHoldRow>>;
  sumActiveAmountByWalletInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    walletId: string,
  ) => Effect.Effect<bigint>;
  releaseByIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    holdId: string,
    releasedAt: Date,
  ) => Effect.Effect<boolean>;
  releaseByWithdrawalIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    withdrawalId: string,
    releasedAt: Date,
  ) => Effect.Effect<boolean>;
  settleByIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    holdId: string,
    settledAt: Date,
  ) => Effect.Effect<boolean>;
  forfeitByIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    holdId: string,
    forfeitedAt: Date,
  ) => Effect.Effect<boolean>;
  settleByWithdrawalIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    withdrawalId: string,
    settledAt: Date,
  ) => Effect.Effect<boolean>;
};

export class WalletHoldServiceTag extends Context.Tag("WalletHoldService")<
  WalletHoldServiceTag,
  WalletHoldService
>() {}

function makeWalletHoldService(
  _repo: import("../../repository/wallet-hold.repository").WalletHoldRepo,
): WalletHoldService {
  return {
    createInTx: (tx, input) => makeWalletHoldRepository(tx).create(input),
    findByIdInTx: (tx, holdId) => makeWalletHoldRepository(tx).findById(holdId),
    findByWithdrawalIdInTx: (tx, withdrawalId) => makeWalletHoldRepository(tx).findByWithdrawalId(withdrawalId),
    findActiveByRentalIdInTx: (tx, rentalId) => makeWalletHoldRepository(tx).findActiveByRentalId(rentalId),
    sumActiveAmountByWalletInTx: (tx, walletId) => makeWalletHoldRepository(tx).sumActiveAmountByWallet(walletId),
    releaseByIdInTx: (tx, holdId, releasedAt) =>
      makeWalletHoldRepository(tx).releaseById(holdId, releasedAt),
    releaseByWithdrawalIdInTx: (tx, withdrawalId, releasedAt) =>
      makeWalletHoldRepository(tx).releaseByWithdrawalId(withdrawalId, releasedAt),
    settleByIdInTx: (tx, holdId, settledAt) =>
      makeWalletHoldRepository(tx).settleById(holdId, settledAt),
    forfeitByIdInTx: (tx, holdId, forfeitedAt) =>
      makeWalletHoldRepository(tx).forfeitById(holdId, forfeitedAt),
    settleByWithdrawalIdInTx: (tx, withdrawalId, settledAt) =>
      makeWalletHoldRepository(tx).settleByWithdrawalId(withdrawalId, settledAt),
  };
}

const makeWalletHoldServiceEffect = Effect.gen(function* () {
  const repo = yield* WalletHoldRepository;
  return makeWalletHoldService(repo);
});

export const WalletHoldServiceLive = Layer.effect(
  WalletHoldServiceTag,
  makeWalletHoldServiceEffect,
);
