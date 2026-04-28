import type { JobPayload } from "@mebike/shared/contracts/server/jobs";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Match } from "effect";

import type { UserQueryServiceTag } from "@/domain/users";
import type {
  StripeWithdrawalServiceTag,
  WithdrawalRepository,
} from "@/domain/wallets";
import type { QueueJob } from "@/infrastructure/jobs/ports";
import type { Prisma } from "@/infrastructure/prisma";

import {
  executeWithdrawalUseCase,
  sweepWithdrawalsUseCase,
} from "@/domain/wallets";
import { decideExecuteWithdrawalOutcome } from "@/domain/wallets/services/workers/execute-withdrawal.policy";
import logger from "@/lib/logger";

import type { EffectRunner } from "./worker-runtime";

type WithdrawalWorkerEnv = Prisma
  | WithdrawalRepository
  | UserQueryServiceTag
  | StripeWithdrawalServiceTag;

export function makeWithdrawalExecuteHandler(runEffect: EffectRunner<WithdrawalWorkerEnv>) {
  return async function handleWithdrawalExecute(job: QueueJob | undefined): Promise<void> {
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

    const result = await runEffect(
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
  };
}

export function makeWithdrawalSweepHandler(runEffect: EffectRunner<WithdrawalWorkerEnv>) {
  return async function handleWithdrawalSweep(job: QueueJob | undefined): Promise<void> {
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

    const result = await runEffect(
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
  };
}
