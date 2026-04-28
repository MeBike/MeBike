import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";

import type { ReturnSlotRepository } from "@/domain/rentals";
import type { QueueJob } from "@/infrastructure/jobs/ports";

import {
  expireReturnSlots,
  returnSlotExpiresAt,
} from "@/domain/rentals";
import logger from "@/lib/logger";
import { notifyReturnSlotExpired } from "@/realtime/return-slot-events";

import type { EffectRunner } from "./worker-runtime";

export function makeReturnSlotExpireSweepHandler(runPromise: EffectRunner<ReturnSlotRepository>) {
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

    const now = new Date();
    const summary = await runPromise(expireReturnSlots({ now }));

    await Promise.all(summary.expiredSlots.map(slot =>
      notifyReturnSlotExpired({
        userId: slot.userId,
        rentalId: slot.rentalId,
        returnSlotId: slot.id,
        stationId: slot.stationId,
        reservedFrom: slot.reservedFrom.toISOString(),
        expiredAt: returnSlotExpiresAt(slot.reservedFrom).toISOString(),
        at: now.toISOString(),
      }),
    ));

    logger.info(
      {
        jobId: job.id,
        expired: summary.expired,
      },
      "Return slot expire sweep completed",
    );
  };
}
