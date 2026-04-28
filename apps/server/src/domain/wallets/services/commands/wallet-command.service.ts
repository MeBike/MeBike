import { Context, Effect, Layer } from "effect";

import type { DecreaseBalanceInput, IncreaseBalanceInput, WalletRow } from "../../models";

import {
  InsufficientWalletBalance,
  WalletAlreadyExists,
  WalletNotFound,
} from "../../domain-errors";
import { WalletCommandRepository } from "../../repository/wallet-command.repository";
import { WalletQueryServiceTag } from "../queries/wallet-query.service";

/**
 * Service ghi wallet cho các flow mutate balance ở HTTP và domain services.
 *
 * Service này map lỗi repository thô sang lỗi domain ổn định cho caller.
 */
export type WalletCommandService = {
  /**
   * Tạo wallet mặc định cho user.
   *
   * @param userId ID user cần tạo wallet.
   */
  createForUser: (
    userId: string,
  ) => Effect.Effect<WalletRow, WalletAlreadyExists>;

  /**
   * Cộng tiền vào wallet và trả về wallet mới nhất.
   *
   * @param input Dữ liệu credit wallet.
   * @param input.userId ID user được cộng tiền.
   * @param input.amount Số tiền gross cần ghi.
   * @param input.fee Phí trừ khỏi amount trước khi tăng balance.
   * @param input.description Mô tả transaction wallet.
   * @param input.hash Khóa idempotency của ledger entry.
   * @param input.type Loại transaction cần ghi.
   */
  creditWallet: (
    input: IncreaseBalanceInput,
  ) => Effect.Effect<WalletRow, WalletNotFound>;

  /**
   * Trừ tiền khỏi available balance và trả về wallet mới nhất.
   *
   * @param input Dữ liệu debit wallet.
   * @param input.userId ID user bị trừ tiền.
   * @param input.amount Số tiền cần trừ khỏi available balance.
   * @param input.description Mô tả transaction wallet.
   * @param input.hash Khóa idempotency của ledger entry.
   * @param input.type Loại transaction cần ghi.
   */
  debitWallet: (
    input: DecreaseBalanceInput,
  ) => Effect.Effect<
    WalletRow,
    WalletNotFound | InsufficientWalletBalance
  >;
};

export class WalletCommandServiceTag extends Context.Tag("WalletCommandService")<
  WalletCommandServiceTag,
  WalletCommandService
>() {}

/**
 * Layer live cho wallet command service.
 *
 * @remarks Cần `WalletCommandRepository` và `WalletQueryServiceTag` trong environment.
 */
export const WalletCommandServiceLive = Layer.effect(
  WalletCommandServiceTag,
  Effect.gen(function* () {
    const repo = yield* WalletCommandRepository;
    const queryService = yield* WalletQueryServiceTag;

    const createForUser: WalletCommandService["createForUser"] = userId =>
      repo.createForUser(userId).pipe(
        Effect.catchTag("WalletUniqueViolation", () =>
          Effect.fail(new WalletAlreadyExists({ userId }))),
      );

    const creditWallet: WalletCommandService["creditWallet"] = input =>
      repo.increaseBalance(input).pipe(
        Effect.catchTag("WalletRecordNotFound", () =>
          Effect.fail(new WalletNotFound({ userId: input.userId }))),
        Effect.catchTag("WalletUniqueViolation", () =>
          queryService.getByUserId(input.userId)),
      );

    const debitWallet: WalletCommandService["debitWallet"] = input =>
      repo.decreaseBalance(input).pipe(
        Effect.catchTag("WalletRecordNotFound", () =>
          Effect.fail(new WalletNotFound({ userId: input.userId }))),
        Effect.catchTag(
          "WalletBalanceConstraint",
          err => Effect.fail(new InsufficientWalletBalance({
            walletId: err.walletId,
            userId: err.userId,
            balance: err.balance,
            attemptedDebit: err.attemptedDebit,
          })),
        ),
      );

    return {
      createForUser,
      creditWallet,
      debitWallet,
    } satisfies WalletCommandService;
  }),
);
