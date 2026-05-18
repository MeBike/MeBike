import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";

import type { QueueJob } from "@/infrastructure/jobs/ports";

import { cancelExpiredPendingRedistributions } from "@/domain/redistribution/services/redistribution-pending-expire.service";
import { Prisma } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

import type { EffectRunner } from "./worker-runtime";

export function makeRedistributionPendingExpireSweepHandler(runEffect: EffectRunner<Prisma>) {
  return async function handleRedistributionPendingExpireSweep(job: QueueJob | undefined): Promise<void> {
    if (!job) {
      logger.warn("Redistribution pending expire sweep worker received empty batch");
      return;
    }

    try {
      parseJobPayload(JobTypes.RedistributionPendingExpireSweep, job.data);
    }
    catch (error) {
      logger.error({ jobId: job.id, error }, "Invalid redistribution pending expire sweep payload");
      throw error;
    }

    const now = new Date();
    const summary = await runEffect(cancelExpiredPendingRedistributions({ now }));

    logger.info(
      {
        jobId: job.id,
        cancelled: summary.cancelled,
      },
      "Redistribution pending expire sweep completed",
    );
  };
}
