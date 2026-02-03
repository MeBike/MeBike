import type { Option } from "effect";

import { Context, Effect, Layer } from "effect";

import type { WithdrawalRepositoryError, WithdrawalUniqueViolation } from "../domain-errors";
import type {
  CreateWalletWithdrawalInput,
  WalletWithdrawalRow,
} from "../models";

import { DuplicateWithdrawalRequest, WithdrawalNotFound } from "../domain-errors";
import { WithdrawalRepository } from "../repository/withdrawal.repository";

export type WithdrawalService = {
  createPending: (
    input: CreateWalletWithdrawalInput,
  ) => Effect.Effect<
    WalletWithdrawalRow,
    WithdrawalRepositoryError | DuplicateWithdrawalRequest
  >;
  getById: (
    withdrawalId: string,
  ) => Effect.Effect<WalletWithdrawalRow, WithdrawalNotFound | WithdrawalRepositoryError>;
  findByIdempotencyKey: (
    idempotencyKey: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>, WithdrawalRepositoryError>;
  findByStripePayoutId: (
    payoutId: string,
  ) => Effect.Effect<Option.Option<WalletWithdrawalRow>, WithdrawalRepositoryError>;
  findProcessingBefore: (
    createdBefore: Date,
    limit: number,
  ) => Effect.Effect<ReadonlyArray<WalletWithdrawalRow>, WithdrawalRepositoryError>;
};

export class WithdrawalServiceTag extends Context.Tag("WithdrawalService")<
  WithdrawalServiceTag,
  WithdrawalService
>() {}

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
