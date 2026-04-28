import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";

import { env } from "@/config/env";
import { defectOn } from "@/domain/shared";
import { UserQueryServiceTag } from "@/domain/users";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
import { makeWalletCommandRepository } from "@/domain/wallets/repository/wallet-command.repository";
import { makeWalletHoldRepository } from "@/domain/wallets/repository/wallet-hold.repository";
import { makeWalletQueryRepository } from "@/domain/wallets/repository/wallet-query.repository";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { WithdrawalUniqueViolation } from "../../domain-errors";
import type { CreateWalletWithdrawalInput, WalletWithdrawalRow } from "../../models";

import {
  DuplicateWithdrawalRequest,
  InvalidWithdrawalRequest,
  StripeConnectNotLinked,
  StripePayoutsNotEnabled,
  WithdrawalUserNotFound,
} from "../../domain-errors";
import { makeWithdrawalRepository } from "../../repository/withdrawal.repository";
import { convertVndToUsdMinor, VND_PER_USD } from "./withdrawal-fx";

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

/**
 * Chuẩn hóa request withdrawal trước khi vào transaction DB.
 *
 * @param input Request withdrawal từ caller.
 * @param input.userId ID user yêu cầu rút tiền.
 * @param input.amount Số tiền VND theo minor unit nội bộ.
 * @param input.currency Currency request, hiện chỉ hỗ trợ `vnd`.
 * @param input.idempotencyKey Khóa idempotency từ client hoặc server tự sinh.
 * @param input.now Mốc thời gian nghiệp vụ cho request.
 */
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

/**
 * Kiểm tra user đã liên kết Stripe Connect và bật payouts.
 *
 * @param user Snapshot user cần kiểm tra trước khi tạo withdrawal.
 */
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

/**
 * Load user tối thiểu cần cho withdrawal flow.
 *
 * @param userService User query service đã được provide từ environment.
 * @param userId ID user cần load.
 */
function loadWithdrawalUser(
  userService: InstanceType<typeof UserQueryServiceTag>,
  userId: string,
): Effect.Effect<WithdrawalUser, WithdrawalUserNotFound> {
  return userService.getById(userId).pipe(
    Effect.flatMap(userOpt =>
      requireOption(userOpt, () => new WithdrawalUserNotFound({ userId }))),
  );
}

/**
 * Build input tạo withdrawal pending từ wallet và request đã normalize.
 *
 * @param args Dữ liệu cần để tạo pending withdrawal.
 * @param args.userId ID user yêu cầu rút tiền.
 * @param args.walletId ID wallet bị reserve balance.
 * @param args.request Request withdrawal đã chuẩn hóa.
 */
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

/**
 * Tạo withdrawal pending và map unique violation sang lỗi idempotency domain.
 *
 * @param repo Withdrawal repo đang bám theo transaction hiện tại.
 * @param input Dữ liệu tạo withdrawal pending.
 */
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

/**
 * Ghi toàn bộ side effect DB cho request withdrawal trong một transaction.
 *
 * Bao gồm tạo withdrawal pending, reserve balance, tạo wallet hold và enqueue job execute.
 *
 * @param args Dữ liệu mutation của flow withdrawal.
 * @param args.client Prisma client root dùng để mở transaction.
 * @param args.userId ID user yêu cầu rút tiền.
 * @param args.request Request withdrawal đã chuẩn hóa.
 */
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
      const walletCommandRepo = makeWalletCommandRepository(tx);
      const walletHoldRepo = makeWalletHoldRepository(tx);
      const walletQueryRepo = makeWalletQueryRepository(tx);
      const withdrawalRepo = makeWithdrawalRepository(tx);

      const wallet = yield* walletQueryRepo.findByUserId(args.userId).pipe(
        Effect.flatMap(walletOpt =>
          requireOption(walletOpt, () => new WalletNotFound({ userId: args.userId }))),
      );

      const withdrawal = yield* createPendingWithdrawal(withdrawalRepo, buildPendingWithdrawalInput({
        userId: args.userId,
        walletId: wallet.id,
        request: args.request,
      }));

      const reservedRows = yield* walletCommandRepo.reserveBalance({
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

/**
 * Tạo yêu cầu rút tiền từ wallet sang Stripe payout worker.
 *
 * Flow này chỉ reserve tiền và enqueue job. Worker mới gọi Stripe để transfer/payout.
 *
 * @param input Request withdrawal từ HTTP/controller hoặc test.
 * @param input.userId ID user yêu cầu rút tiền.
 * @param input.amount Số tiền VND theo minor unit nội bộ.
 * @param input.currency Currency request, hiện chỉ hỗ trợ `vnd`.
 * @param input.idempotencyKey Khóa idempotency từ client.
 * @param input.now Mốc thời gian nghiệp vụ, mặc định là hiện tại.
 */
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
