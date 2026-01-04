import type { Option } from "effect";

import { Context, Effect, Layer } from "effect";

import type { WalletHoldRepositoryError } from "../domain-errors";
import type { CreateWalletHoldInput, WalletHoldRow } from "../models";

import { WalletHoldRepository } from "../repository/wallet-hold.repository";

export type WalletHoldService = {
  createInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: CreateWalletHoldInput,
  ) => Effect.Effect<WalletHoldRow, WalletHoldRepositoryError>;
  findByWithdrawalIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    withdrawalId: string,
  ) => Effect.Effect<Option.Option<WalletHoldRow>, WalletHoldRepositoryError>;
  sumActiveAmountByWalletInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    walletId: string,
  ) => Effect.Effect<bigint, WalletHoldRepositoryError>;
  releaseByWithdrawalIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    withdrawalId: string,
    releasedAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
  settleByWithdrawalIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    withdrawalId: string,
    settledAt: Date,
  ) => Effect.Effect<boolean, WalletHoldRepositoryError>;
};

export class WalletHoldServiceTag extends Context.Tag("WalletHoldService")<
  WalletHoldServiceTag,
  WalletHoldService
>() {}

function makeWalletHoldService(
  repo: import("../repository/wallet-hold.repository").WalletHoldRepo,
): WalletHoldService {
  return {
    createInTx: (tx, input) => repo.createInTx(tx, input),
    findByWithdrawalIdInTx: (tx, withdrawalId) => repo.findByWithdrawalIdInTx(tx, withdrawalId),
    sumActiveAmountByWalletInTx: (tx, walletId) => repo.sumActiveAmountByWalletInTx(tx, walletId),
    releaseByWithdrawalIdInTx: (tx, withdrawalId, releasedAt) =>
      repo.releaseByWithdrawalIdInTx(tx, withdrawalId, releasedAt),
    settleByWithdrawalIdInTx: (tx, withdrawalId, settledAt) =>
      repo.settleByWithdrawalIdInTx(tx, withdrawalId, settledAt),
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
