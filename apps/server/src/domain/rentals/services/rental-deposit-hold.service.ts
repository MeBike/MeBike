import { Effect, Option } from "effect";

import type {
  WalletHoldRepositoryError,
  WalletRepositoryError,
} from "@/domain/wallets/domain-errors";
import type { WalletHoldRow } from "@/domain/wallets/models";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import {
  InsufficientWalletBalance,
  WalletNotFound,
} from "@/domain/wallets/domain-errors";
import { makeWalletHoldRepository } from "@/domain/wallets/repository/wallet-hold.repository";
import { makeWalletRepository } from "@/domain/wallets/repository/wallet.repository";

import { RentalRepositoryError } from "../domain-errors";
import { makeRentalRepository } from "../repository/rental.repository";

type CreateRentalDepositHoldInput = {
  tx: PrismaTypes.TransactionClient;
  rentalId: string;
  userId: string;
  amount: bigint;
};

type ReleaseRentalDepositHoldInput = {
  tx: PrismaTypes.TransactionClient;
  holdId: string;
  releasedAt: Date;
};

export function createRentalDepositHoldInTx(
  input: CreateRentalDepositHoldInput,
): Effect.Effect<
  WalletHoldRow,
  | WalletNotFound
  | InsufficientWalletBalance
  | WalletRepositoryError
  | WalletHoldRepositoryError
  | RentalRepositoryError
> {
  return Effect.gen(function* () {
    const txWalletRepo = makeWalletRepository(input.tx);
    const txWalletHoldRepo = makeWalletHoldRepository(input.tx);
    const txRentalRepo = makeRentalRepository(input.tx);

    const walletOpt = yield* txWalletRepo.findByUserId(input.userId);
    if (Option.isNone(walletOpt)) {
      return yield* Effect.fail(new WalletNotFound({ userId: input.userId }));
    }

    const wallet = walletOpt.value;
    const reserved = yield* txWalletRepo.reserveBalance({
      walletId: wallet.id,
      amount: input.amount,
    });
    if (!reserved) {
      return yield* Effect.fail(new InsufficientWalletBalance({
        walletId: wallet.id,
        userId: input.userId,
        balance: wallet.balance - wallet.reservedBalance,
        attemptedDebit: input.amount,
      }));
    }

    const hold = yield* txWalletHoldRepo.create({
      walletId: wallet.id,
      rentalId: input.rentalId,
      amount: input.amount,
      reason: "RENTAL_DEPOSIT",
    });

    const updatedRental = yield* txRentalRepo.updateRentalDepositHold({
      rentalId: input.rentalId,
      depositHoldId: hold.id,
    });
    if (Option.isNone(updatedRental)) {
      return yield* Effect.fail(new RentalRepositoryError({
        operation: "createRentalDepositHoldInTx.updateRentalDepositHold",
        cause: new Error(`Rental ${input.rentalId} was not updated with deposit hold ${hold.id}`),
      }));
    }

    return hold;
  });
}

export function releaseRentalDepositHoldInTx(
  input: ReleaseRentalDepositHoldInput,
): Effect.Effect<boolean, WalletHoldRepositoryError | WalletRepositoryError> {
  return Effect.gen(function* () {
    const txWalletHoldRepo = makeWalletHoldRepository(input.tx);
    const txWalletRepo = makeWalletRepository(input.tx);

    const holdOpt = yield* txWalletHoldRepo.findById(input.holdId);
    if (Option.isNone(holdOpt)) {
      return false;
    }

    const hold = holdOpt.value;
    if (hold.status !== "ACTIVE") {
      return false;
    }

    const released = yield* txWalletHoldRepo.releaseById(input.holdId, input.releasedAt);
    if (!released) {
      return false;
    }

    const releasedReservedBalance = yield* txWalletRepo.releaseReservedBalance({
      walletId: hold.walletId,
      amount: hold.amount,
    });
    return releasedReservedBalance;
  });
}
