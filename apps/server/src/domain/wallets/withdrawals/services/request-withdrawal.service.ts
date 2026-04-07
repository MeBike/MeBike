import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";

import { env } from "@/config/env";
import { defectOn } from "@/domain/shared";
import { UserQueryServiceTag } from "@/domain/users";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
import { makeWalletHoldRepository } from "@/domain/wallets/repository/wallet-hold.repository";
import { makeWalletRepository } from "@/domain/wallets/repository/wallet.repository";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { WithdrawalUniqueViolation } from "../domain-errors";
import type { CreateWalletWithdrawalInput, WalletWithdrawalRow } from "../models";

import {
  DuplicateWithdrawalRequest,
  InvalidWithdrawalRequest,
  StripeConnectNotLinked,
  StripePayoutsNotEnabled,
  WithdrawalUserNotFound,
} from "../domain-errors";
import { convertVndToUsdMinor, VND_PER_USD } from "../fx";
import { makeWithdrawalRepository } from "../repository/withdrawal.repository";

const WITHDRAWAL_CURRENCY = "vnd" as const;
const PAYOUT_CURRENCY = "usd" as const;

type WithdrawalUser = {
  readonly id: string;
  readonly stripeConnectedAccountId: string | null;
  readonly stripePayoutsEnabled: boolean | null;
};

type NormalizedWithdrawalRequest = {
  readonly amount: bigint;
  readonly currency: typeof WITHDRAWAL_CURRENCY;
  readonly idempotencyKey: string;
  readonly now: Date;
  readonly payoutAmount: bigint;
};

function invalidWithdrawalRequest(message: string) {
  return new InvalidWithdrawalRequest({ message });
}

function requireOption<A, E>(
  option: Option.Option<A>,
  orElse: () => E,
): Effect.Effect<A, E> {
  return Option.isSome(option)
    ? Effect.succeed(option.value)
    : Effect.fail(orElse());
}

function normalizeWithdrawalRequest(
  input: RequestWithdrawalInput,
): Effect.Effect<NormalizedWithdrawalRequest, InvalidWithdrawalRequest> {
  const minAmount = BigInt(env.MIN_WITHDRAWAL_AMOUNT);
  if (input.amount <= 0n || input.amount < minAmount) {
    return Effect.fail(invalidWithdrawalRequest(`amount must be at least ${minAmount.toString()}`));
  }

  if (input.currency && input.currency.toLowerCase() !== WITHDRAWAL_CURRENCY) {
    return Effect.fail(invalidWithdrawalRequest("currency must be vnd"));
  }

  const payoutAmount = convertVndToUsdMinor(input.amount);
  if (!payoutAmount) {
    return Effect.fail(invalidWithdrawalRequest("amount too small after VND to USD conversion"));
  }

  return Effect.succeed({
    amount: input.amount,
    currency: WITHDRAWAL_CURRENCY,
    idempotencyKey: input.idempotencyKey ?? `withdraw:${uuidv7()}`,
    now: input.now ?? new Date(),
    payoutAmount,
  });
}

function ensureUserCanRequestWithdrawal(
  user: WithdrawalUser,
): Effect.Effect<WithdrawalUser, StripeConnectNotLinked | StripePayoutsNotEnabled> {
  const accountId = user.stripeConnectedAccountId;
  if (!accountId) {
    return Effect.fail(new StripeConnectNotLinked({ userId: user.id }));
  }

  if (user.stripePayoutsEnabled !== true) {
    return Effect.fail(new StripePayoutsNotEnabled({
      userId: user.id,
      accountId,
    }));
  }

  return Effect.succeed(user);
}

function loadWithdrawalUser(
  userService: InstanceType<typeof UserQueryServiceTag>,
  userId: string,
): Effect.Effect<WithdrawalUser, WithdrawalUserNotFound> {
  return userService.getById(userId).pipe(
    Effect.flatMap(userOpt =>
      requireOption(userOpt, () => new WithdrawalUserNotFound({ userId }))),
  );
}

function buildPendingWithdrawalInput(args: {
  readonly userId: string;
  readonly walletId: string;
  readonly request: NormalizedWithdrawalRequest;
}): CreateWalletWithdrawalInput {
  return {
    userId: args.userId,
    walletId: args.walletId,
    amount: args.request.amount,
    currency: args.request.currency,
    payoutAmount: args.request.payoutAmount,
    payoutCurrency: PAYOUT_CURRENCY,
    fxRate: VND_PER_USD,
    fxQuotedAt: args.request.now,
    idempotencyKey: args.request.idempotencyKey,
  };
}

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

function requestWithdrawalInTransaction(args: {
  readonly client: import("generated/prisma/client").PrismaClient;
  readonly userId: string;
  readonly request: NormalizedWithdrawalRequest;
}): Effect.Effect<
  WalletWithdrawalRow,
  DuplicateWithdrawalRequest | InsufficientWalletBalance | WalletNotFound
> {
  return runPrismaTransaction(args.client, tx =>
    Effect.gen(function* () {
      const walletRepo = makeWalletRepository(tx);
      const walletHoldRepo = makeWalletHoldRepository(tx);
      const withdrawalRepo = makeWithdrawalRepository(tx);

      const wallet = yield* walletRepo.findByUserId(args.userId).pipe(
        Effect.flatMap(walletOpt =>
          requireOption(walletOpt, () => new WalletNotFound({ userId: args.userId }))),
      );

      const withdrawal = yield* createPendingWithdrawal(withdrawalRepo, buildPendingWithdrawalInput({
        userId: args.userId,
        walletId: wallet.id,
        request: args.request,
      }));

      const reservedRows = yield* walletRepo.reserveBalance({
        walletId: wallet.id,
        amount: args.request.amount,
      });

      if (!reservedRows) {
        return yield* Effect.fail(new InsufficientWalletBalance({
          walletId: wallet.id,
          userId: args.userId,
          balance: wallet.balance - wallet.reservedBalance,
          attemptedDebit: args.request.amount,
        }));
      }

      yield* walletHoldRepo.create({
        walletId: wallet.id,
        withdrawalId: withdrawal.id,
        amount: args.request.amount,
        reason: "WITHDRAWAL",
      });

      yield* enqueueOutboxJobInTx(tx, {
        type: JobTypes.WalletWithdrawalExecute,
        payload: {
          version: 1,
          withdrawalId: withdrawal.id,
        },
        runAt: args.request.now,
        dedupeKey: `withdrawal:execute:${withdrawal.id}`,
      });

      return withdrawal;
    })).pipe(defectOn(PrismaTransactionError));
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
  | WithdrawalUserNotFound,
  Prisma | UserQueryServiceTag
> {
  return Effect.gen(function* () {
    const request = yield* normalizeWithdrawalRequest(input);
    const userService = yield* UserQueryServiceTag;
    const { client } = yield* Prisma;

    const user = yield* loadWithdrawalUser(userService, input.userId);
    yield* ensureUserCanRequestWithdrawal(user);

    return yield* requestWithdrawalInTransaction({
      client,
      userId: user.id,
      request,
    });
  });
}
