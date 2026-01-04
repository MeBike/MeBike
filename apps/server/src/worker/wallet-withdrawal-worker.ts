import type { JobPayload } from "@mebike/shared/contracts/server/jobs";
import type { Job } from "pg-boss";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Layer, Match } from "effect";

import {
  UserRepositoryLive,
  UserServiceLive,
} from "@/domain/users";
import {
  WalletHoldRepositoryLive,
  WalletHoldServiceLive,
  WalletRepositoryLive,
  WalletServiceLive,
} from "@/domain/wallets";
import {
  executeWithdrawalUseCase,
  StripeWithdrawalServiceLive,
  sweepWithdrawalsUseCase,
  WithdrawalRepositoryLive,
  WithdrawalServiceLive,
} from "@/domain/wallets/withdrawals";
import { decideExecuteWithdrawalOutcome } from "@/domain/wallets/withdrawals/execute-withdrawal.policy";
import { PrismaLive } from "@/infrastructure/prisma";
import { StripeLive } from "@/infrastructure/stripe";
import logger from "@/lib/logger";

const UserReposLive = UserRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const UserServiceLayer = UserServiceLive.pipe(
  Layer.provide(UserReposLive),
);

const WalletReposLive = WalletRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletHoldReposLive = WalletHoldRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletServiceLayer = WalletServiceLive.pipe(
  Layer.provide(WalletReposLive),
);

const WalletHoldServiceLayer = WalletHoldServiceLive.pipe(
  Layer.provide(WalletHoldReposLive),
);

const WithdrawalReposLive = WithdrawalRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WithdrawalServiceLayer = WithdrawalServiceLive.pipe(
  Layer.provide(WithdrawalReposLive),
);

const StripeWithdrawalServiceLayer = StripeWithdrawalServiceLive.pipe(
  Layer.provide(StripeLive),
);

const WithdrawalWorkerLive = Layer.mergeAll(
  UserReposLive,
  UserServiceLayer,
  WalletReposLive,
  WalletServiceLayer,
  WalletHoldReposLive,
  WalletHoldServiceLayer,
  WithdrawalReposLive,
  WithdrawalServiceLayer,
  StripeWithdrawalServiceLayer,
  StripeLive,
  PrismaLive,
);

type WithdrawalWorkerEnv = Layer.Layer.Success<typeof WithdrawalWorkerLive>;

function runWithdrawalEffect<A, E>(
  eff: Effect.Effect<A, E, WithdrawalWorkerEnv>,
): Promise<A> {
  return Effect.runPromise(eff.pipe(Effect.provide(WithdrawalWorkerLive)));
}

export async function handleWithdrawalExecute(
  job: Job<unknown> | undefined,
): Promise<void> {
  if (!job) {
    logger.warn("Withdrawal execute worker received empty batch");
    return;
  }

  let payload: JobPayload<typeof JobTypes.WalletWithdrawalExecute>;
  try {
    payload = parseJobPayload(JobTypes.WalletWithdrawalExecute, job.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Invalid withdrawal execute payload");
    throw err;
  }

  const result = await runWithdrawalEffect(
    executeWithdrawalUseCase(payload.withdrawalId).pipe(Effect.either),
  );

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      logger.info(
        { jobId: job.id, withdrawalId: payload.withdrawalId, outcome: right },
        "wallets.withdraw.execute processed",
      );
      const decision = decideExecuteWithdrawalOutcome(right);
      if (decision.action === "retry") {
        throw new Error(decision.reason);
      }
    }),
    Match.tag("Left", ({ left }) => {
      logger.error(
        { jobId: job.id, withdrawalId: payload.withdrawalId, error: left },
        "wallets.withdraw.execute failed",
      );
      throw left;
    }),
    Match.exhaustive,
  );
}

export async function handleWithdrawalSweep(
  job: Job<unknown> | undefined,
): Promise<void> {
  if (!job) {
    logger.warn("Withdrawal sweep worker received empty batch");
    return;
  }

  try {
    parseJobPayload(JobTypes.WalletWithdrawalSweep, job.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Invalid withdrawal sweep payload");
    throw err;
  }

  const result = await runWithdrawalEffect(
    sweepWithdrawalsUseCase(new Date()).pipe(Effect.either),
  );

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      logger.info(
        { jobId: job.id, summary: right },
        "wallets.withdraw.sweep completed",
      );
    }),
    Match.tag("Left", ({ left }) => {
      logger.error(
        { jobId: job.id, error: left },
        "wallets.withdraw.sweep failed",
      );
      throw left;
    }),
    Match.exhaustive,
  );
}
