import type { Option } from "effect";

import { Context, Effect, Layer } from "effect";

import type { WithdrawalUniqueViolation } from "../../domain-errors";
import type {
  CreateWalletWithdrawalInput,
  WalletWithdrawalRow,
} from "../../models";

import { DuplicateWithdrawalRequest, WithdrawalNotFound } from "../../domain-errors";
import { WithdrawalRepository } from "../../repository/withdrawal.repository";

/**
 * Service command/query mỏng cho withdrawal aggregate.
 *
 * Giữ riêng với wallet balance vì withdrawal có lifecycle provider riêng
 * (`PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`).
 */
export type WithdrawalService = {
  /**
   * Tạo withdrawal pending với idempotency handling.
   *
   * @param input Dữ liệu tạo withdrawal pending.
   * @param input.userId ID user yêu cầu rút tiền.
   * @param input.walletId ID wallet bị reserve balance.
   * @param input.amount Số tiền rút theo currency nội bộ.
   * @param input.currency Currency nội bộ của withdrawal.
   * @param input.payoutAmount Số tiền payout theo provider currency.
   * @param input.payoutCurrency Currency dùng cho provider payout.
   * @param input.fxRate Tỷ giá đã quote cho request.
   * @param input.fxQuotedAt Thời điểm quote tỷ giá.
   * @param input.idempotencyKey Khóa idempotency của request.
   */
  createPending: (
    input: CreateWalletWithdrawalInput,
  ) => Effect.Effect<WalletWithdrawalRow, DuplicateWithdrawalRequest>;

  /**
   * Đọc withdrawal bắt buộc theo id.
   *
   * @param withdrawalId ID withdrawal cần đọc.
   */
  getById: (withdrawalId: string) => Effect.Effect<WalletWithdrawalRow, WithdrawalNotFound>;

  /**
   * Đọc withdrawal theo idempotency key.
   *
   * @param idempotencyKey Khóa idempotency của request withdrawal.
   */
  findByIdempotencyKey: (
    idempotencyKey: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>>;

  /**
   * Đọc withdrawal theo Stripe payout id.
   *
   * @param payoutId ID payout từ Stripe.
   */
  findByStripePayoutId: (
    payoutId: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>>;

  /**
   * List withdrawal đang processing quá lâu để worker sweep reconcile.
   *
   * @param createdBefore Cutoff thời gian tạo withdrawal.
   * @param limit Số dòng tối đa cần lấy.
   */
  findProcessingBefore: (
    createdBefore: Date,
    limit: number,
  ) => Effect.Effect<ReadonlyArray<WalletWithdrawalRow>>;
};

export class WithdrawalServiceTag extends Context.Tag("WithdrawalService")<
  WithdrawalServiceTag,
  WithdrawalService
>() {}

/**
 * Layer live cho withdrawal service.
 *
 * @remarks Cần `WithdrawalRepository` trong environment.
 */
export const WithdrawalServiceLive = Layer.effect(
  WithdrawalServiceTag,
  Effect.gen(function* () {
    const repo = yield* WithdrawalRepository;

    const createPending: WithdrawalService["createPending"] = input =>
      repo.createPending(input).pipe(
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

    const getById: WithdrawalService["getById"] = withdrawalId =>
      repo.findById(withdrawalId).pipe(
        Effect.flatMap(maybe =>
          maybe._tag === "Some"
            ? Effect.succeed(maybe.value)
            : Effect.fail(new WithdrawalNotFound({ withdrawalId })),
        ),
      );

    const findByIdempotencyKey: WithdrawalService["findByIdempotencyKey"] = idempotencyKey =>
      repo.findByIdempotencyKey(idempotencyKey);

    const findByStripePayoutId: WithdrawalService["findByStripePayoutId"] = payoutId =>
      repo.findByStripePayoutId(payoutId);

    const findProcessingBefore: WithdrawalService["findProcessingBefore"] = (createdBefore, limit) =>
      repo.findProcessingBefore(createdBefore, limit);

    const service: WithdrawalService = {
      createPending,
      getById,
      findByIdempotencyKey,
      findByStripePayoutId,
      findProcessingBefore,
    };

    return service;
  }),
);
