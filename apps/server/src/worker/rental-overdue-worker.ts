import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";

import type { QueueJob } from "@/infrastructure/jobs/ports";

import { sweepOverdueRentals } from "@/domain/rentals/services/workers/rental-overdue-sweep.service";
import { Prisma } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

import type { EffectRunner } from "./worker-runtime";

export function makeRentalOverdueSweepHandler(runEffect: EffectRunner<Prisma>) {
  return async function handleRentalOverdueSweep(job: QueueJob | undefined): Promise<void> {
    if (!job) {
      logger.warn("Overdue rental sweep worker received empty batch");
      return;
    }

    try {
      parseJobPayload(JobTypes.RentalOverdueSweep, job.data);
    }
    catch (error) {
      logger.error({ jobId: job.id, error }, "Invalid overdue sweep payload");
      throw error;
    }

    const summary = await runEffect(Effect.gen(function* () {
      const { client } = yield* Prisma;
      return yield* Effect.promise(() => sweepOverdueRentals(client, new Date()));
    }));

    logger.info(
      {
        jobId: job.id,
        scanned: summary.scanned,
        overdue: summary.overdue,
        skipped: summary.skipped,
        failed: summary.failed,
        depositForfeited: summary.depositForfeited,
        bikeUnavailable: summary.bikeUnavailable,
        cancelledReturnSlots: summary.cancelledReturnSlots,
      },
      "Overdue rental sweep completed",
    );
  };
}
