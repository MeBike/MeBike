import type { Effect } from "effect";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";

import type { ReturnSlotRepository } from "@/domain/rentals";
import type { QueueJob } from "@/infrastructure/jobs/ports";

import {
  expireReturnSlots,
} from "@/domain/rentals";
import logger from "@/lib/logger";

type ReturnSlotExpiryRunner = <A, E>(
  effect: Effect.Effect<A, E, ReturnSlotRepository>,
) => Promise<A>;

export function makeReturnSlotExpireSweepHandler(runPromise: ReturnSlotExpiryRunner) {
  return async function handleReturnSlotExpireSweep(job: QueueJob | undefined): Promise<void> {
    if (!job) {
      logger.warn("Return slot expire worker received empty batch");
      return;
    }

    try {
      parseJobPayload(JobTypes.ReturnSlotExpireSweep, job.data);
    }
    catch (error) {
      logger.error({ jobId: job.id, error }, "Invalid return slot expire payload");
      throw error;
    }

    const summary = await runPromise(expireReturnSlots({ now: new Date() }));

    logger.info(
      {
        jobId: job.id,
        expired: summary.expired,
      },
      "Return slot expire sweep completed",
    );
  };
}
