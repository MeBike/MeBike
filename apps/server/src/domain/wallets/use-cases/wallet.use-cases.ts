import type { Option } from "effect";

import { Effect } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  InsufficientWalletBalance,
  WalletAlreadyExists,
  WalletNotFound,
  WalletRepositoryError,
} from "../domain-errors";
import type { DecreaseBalanceInput, IncreaseBalanceInput, WalletRow, WalletTransactionRow } from "../models";

import { WalletServiceTag } from "../services/wallet.service";

export function createWalletForUserUseCase(
  userId: string,
): Effect.Effect<WalletRow, WalletAlreadyExists | WalletRepositoryError, WalletServiceTag> {
  return Effect.gen(function* () {
    const service = yield* WalletServiceTag;
    return yield* service.createForUser(userId);
  });
}

export function getWalletByUserIdUseCase(
  userId: string,
): Effect.Effect<Option.Option<WalletRow>, WalletRepositoryError, WalletServiceTag> {
  return Effect.gen(function* () {
    const service = yield* WalletServiceTag;
    return yield* service.getOptionalByUserId(userId);
  });
}

export function getRequiredWalletByUserIdUseCase(
  userId: string,
): Effect.Effect<WalletRow, WalletNotFound | WalletRepositoryError, WalletServiceTag> {
  return Effect.gen(function* () {
    const service = yield* WalletServiceTag;
    return yield* service.getByUserId(userId);
  });
}

export function creditWalletUseCase(
  input: IncreaseBalanceInput,
): Effect.Effect<WalletRow, WalletNotFound | WalletRepositoryError, WalletServiceTag> {
  return Effect.gen(function* () {
    const service = yield* WalletServiceTag;
    return yield* service.creditWallet(input);
  });
}

export function debitWalletUseCase(
  input: DecreaseBalanceInput,
): Effect.Effect<
  WalletRow,
  WalletNotFound | InsufficientWalletBalance | WalletRepositoryError,
  WalletServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* WalletServiceTag;
    return yield* service.debitWallet(input);
  });
}

export function listWalletTransactionsForUserUseCase(
  args: { userId: string; pageReq: PageRequest<"createdAt"> },
): Effect.Effect<PageResult<WalletTransactionRow>, WalletNotFound | WalletRepositoryError, WalletServiceTag> {
  return Effect.gen(function* () {
    const service = yield* WalletServiceTag;
    return yield* service.listTransactionsForUser(args);
  });
}
