import type { Option } from "effect";

import { Context, Effect, Layer } from "effect";

import type { WithdrawalRepositoryError, WithdrawalUniqueViolation } from "../domain-errors";
import type {
  CreateWalletWithdrawalInput,
  MarkWithdrawalProcessingInput,
  MarkWithdrawalResultInput,
  UpdateWithdrawalStripeRefsInput,
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
  createPendingInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: CreateWalletWithdrawalInput,
  ) => Effect.Effect<
    WalletWithdrawalRow,
    WithdrawalRepositoryError | DuplicateWithdrawalRequest
  >;
  getById: (
    withdrawalId: string,
  ) => Effect.Effect<WalletWithdrawalRow, WithdrawalNotFound | WithdrawalRepositoryError>;
  getByIdInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
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
  markProcessingInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: MarkWithdrawalProcessingInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  setStripeRefsInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: UpdateWithdrawalStripeRefsInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  markSucceededInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: MarkWithdrawalResultInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
  markFailedInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: MarkWithdrawalResultInput,
  ) => Effect.Effect<boolean, WithdrawalRepositoryError>;
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

    const createPendingInTx: WithdrawalService["createPendingInTx"] = (tx, input) =>
      repo.createPendingInTx(tx, input).pipe(
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

    const getByIdInTx: WithdrawalService["getByIdInTx"] = (tx, withdrawalId) =>
      repo.findByIdInTx(tx, withdrawalId).pipe(
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

    const markProcessingInTx: WithdrawalService["markProcessingInTx"] = (tx, input) =>
      repo.markProcessingInTx(tx, input);

    const setStripeRefsInTx: WithdrawalService["setStripeRefsInTx"] = (tx, input) =>
      repo.setStripeRefsInTx(tx, input);

    const markSucceededInTx: WithdrawalService["markSucceededInTx"] = (tx, input) =>
      repo.markSucceededInTx(tx, input);

    const markFailedInTx: WithdrawalService["markFailedInTx"] = (tx, input) =>
      repo.markFailedInTx(tx, input);

    const service: WithdrawalService = {
      createPending,
      createPendingInTx,
      getById,
      getByIdInTx,
      findByIdempotencyKey,
      findByStripePayoutId,
      findProcessingBefore,
      markProcessingInTx,
      setStripeRefsInTx,
      markSucceededInTx,
      markFailedInTx,
    };

    return service;
  }),
);
