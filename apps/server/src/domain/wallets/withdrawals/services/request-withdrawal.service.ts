import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect, Match } from "effect";
import { uuidv7 } from "uuidv7";

import type { UserRepositoryError } from "@/domain/users/domain-errors";
import type {
  WalletHoldRepositoryError,
  WalletRepositoryError,
} from "@/domain/wallets/domain-errors";

import { env } from "@/config/env";
import { UserServiceTag } from "@/domain/users/services/user.service";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
import { makeWalletHoldRepository } from "@/domain/wallets/repository/wallet-hold.repository";
import { makeWalletRepository } from "@/domain/wallets/repository/wallet.repository";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { WithdrawalRepositoryError, WithdrawalUniqueViolation } from "../domain-errors";
import type { CreateWalletWithdrawalInput, WalletWithdrawalRow } from "../models";

import {
  DuplicateWithdrawalRequest,
  InvalidWithdrawalRequest,
  StripeConnectNotLinked,
  StripePayoutsNotEnabled,
  WithdrawalUserNotFound,
} from "../domain-errors";
import { makeWithdrawalRepository } from "../repository/withdrawal.repository";

function createPendingWithdrawal(
  repo: ReturnType<typeof makeWithdrawalRepository>,
  input: CreateWalletWithdrawalInput,
) {
  return repo.createPending(input).pipe(
    Effect.catchTag("WithdrawalUniqueViolation", (err: WithdrawalUniqueViolation) =>
      repo.findByIdempotencyKey(input.idempotencyKey).pipe(
        Effect.flatMap(maybeExisting =>
          maybeExisting._tag === "Some"
            ? Effect.fail(new DuplicateWithdrawalRequest({
                idempotencyKey: input.idempotencyKey,
                existing: maybeExisting.value,
              }))
            : Effect.die(new Error(
                `Invariant violated: WithdrawalUniqueViolation but no row found for idempotencyKey ${input.idempotencyKey} (cause: ${String(err.cause)})`,
              )),
        ),
      )),
  );
}

export type RequestWithdrawalInput = {
  readonly userId: string;
  readonly amount: bigint;
  readonly currency?: string;
  readonly idempotencyKey?: string;
  readonly now?: Date;
};

export function requestWithdrawalUseCase(
  input: RequestWithdrawalInput,
): Effect.Effect<
  WalletWithdrawalRow,
  | InvalidWithdrawalRequest
  | StripeConnectNotLinked
  | StripePayoutsNotEnabled
  | DuplicateWithdrawalRequest
  | InsufficientWalletBalance
  | WalletNotFound
  | WalletHoldRepositoryError
  | WalletRepositoryError
  | UserRepositoryError
  | WithdrawalRepositoryError
  | WithdrawalUserNotFound,
  Prisma | UserServiceTag
> {
  return Effect.gen(function* () {
    const minAmount = BigInt(env.MIN_WITHDRAWAL_AMOUNT);
    if (input.amount <= 0n || input.amount < minAmount) {
      return yield* Effect.fail(new InvalidWithdrawalRequest({
        message: `amount must be at least ${minAmount.toString()}`,
      }));
    }

    const userService = yield* UserServiceTag;
    const { client } = yield* Prisma;

    const userOpt = yield* userService.getById(input.userId);
    const user = yield* Match.value(userOpt).pipe(
      Match.tag("Some", ({ value }) => Effect.succeed(value)),
      Match.tag("None", () => Effect.fail(new WithdrawalUserNotFound({ userId: input.userId }))),
      Match.exhaustive,
    );

    const accountId = user.stripeConnectedAccountId;
    if (!accountId) {
      return yield* Effect.fail(new StripeConnectNotLinked({ userId: user.id }));
    }

    if (user.stripePayoutsEnabled !== true) {
      return yield* Effect.fail(new StripePayoutsNotEnabled({
        userId: user.id,
        accountId,
      }));
    }

    if (input.currency && input.currency.toLowerCase() !== "usd") {
      return yield* Effect.fail(new InvalidWithdrawalRequest({
        message: "currency must be usd",
      }));
    }

    const currency = "usd";
    const now = input.now ?? new Date();
    const idempotencyKey = input.idempotencyKey ?? `withdraw:${uuidv7()}`;

    const withdrawal = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const txWalletRepo = makeWalletRepository(tx);
        const txWalletHoldRepo = makeWalletHoldRepository(tx);
        const txWithdrawalRepo = makeWithdrawalRepository(tx);

        const walletOpt = yield* txWalletRepo.findByUserId(user.id);
        const wallet = yield* Match.value(walletOpt).pipe(
          Match.tag("Some", ({ value }) => Effect.succeed(value)),
          Match.tag("None", () => Effect.fail(new WalletNotFound({ userId: user.id }))),
          Match.exhaustive,
        );

        const withdrawal = yield* createPendingWithdrawal(txWithdrawalRepo, {
          userId: user.id,
          walletId: wallet.id,
          amount: input.amount,
          currency,
          idempotencyKey,
        });

        const reservedRows = yield* txWalletRepo.reserveBalance({
          walletId: wallet.id,
          amount: input.amount,
        });

        const available = wallet.balance - wallet.reservedBalance;
        if (!reservedRows) {
          return yield* Effect.fail(new InsufficientWalletBalance({
            walletId: wallet.id,
            userId: user.id,
            balance: available,
            attemptedDebit: input.amount,
          }));
        }

        yield* txWalletHoldRepo.create({
          walletId: wallet.id,
          withdrawalId: withdrawal.id,
          amount: input.amount,
          reason: "WITHDRAWAL",
        });

        yield* enqueueOutboxJobInTx(tx, {
          type: JobTypes.WalletWithdrawalExecute,
          payload: {
            version: 1,
            withdrawalId: withdrawal.id,
          },
          runAt: now,
          dedupeKey: `withdrawal:execute:${withdrawal.id}`,
        });

        return withdrawal;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    return withdrawal;
  });
}
