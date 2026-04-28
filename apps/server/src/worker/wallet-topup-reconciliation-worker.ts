import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Match } from "effect";

import type {
  PaymentAttemptRepository,
  StripeTopupServiceTag,
} from "@/domain/wallets/topups";
import type { QueueJob } from "@/infrastructure/jobs/ports";
import type { Prisma } from "@/infrastructure/prisma";

import { sweepTopupReconciliation } from "@/domain/wallets/topups";
import logger from "@/lib/logger";

import type { EffectRunner } from "./worker-runtime";

type TopupReconciliationWorkerEnv = Prisma | PaymentAttemptRepository | StripeTopupServiceTag;

export function makeTopupReconciliationSweepHandler(
  runEffect: EffectRunner<TopupReconciliationWorkerEnv>,
) {
  return async function handleTopupReconciliationSweep(job: QueueJob | undefined): Promise<void> {
    if (!job) {
      logger.warn("Top-up reconciliation sweep worker received empty batch");
      return;
    }

    try {
      parseJobPayload(JobTypes.WalletTopupReconcileSweep, job.data);
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ jobId: job.id, error: message }, "Invalid top-up reconciliation sweep payload");
      throw err;
    }

    const result = await runEffect(
      sweepTopupReconciliation(new Date()).pipe(Effect.either),
    );

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) => {
        logger.info(
          { jobId: job.id, summary: right },
          "wallets.topup.reconcileSweep completed",
        );
      }),
      Match.tag("Left", ({ left }) => {
        logger.error(
          { jobId: job.id, error: left },
          "wallets.topup.reconcileSweep failed",
        );
        throw left;
      }),
      Match.exhaustive,
    );
  };
}
