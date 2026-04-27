import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";

import type { BikeRepository } from "@/domain/bikes";
import type { QueueJob } from "@/infrastructure/jobs/ports";
import type { Prisma } from "@/infrastructure/prisma";

import {
  assignFixedSlotReservations,
  parseSlotDateKey,
} from "@/domain/reservations";
import logger from "@/lib/logger";

import type { EffectRunner } from "./worker-runtime";

export function makeFixedSlotAssignHandler(
  runEffect: EffectRunner<Prisma | BikeRepository>,
) {
  return async function handleFixedSlotAssign(job: QueueJob | undefined): Promise<void> {
    if (!job) {
      logger.warn("Fixed-slot worker received empty batch");
      return;
    }

    const payload = parseJobPayload(JobTypes.ReservationFixedSlotAssign, job.data);
    const slotDate = payload.slotDate ? parseSlotDateKey(payload.slotDate) : undefined;

    const summary = await runEffect(
      assignFixedSlotReservations({
        slotDate,
        assignmentTime: new Date(),
      }),
    );

    logger.info(
      {
        jobId: job.id,
        slotDate: summary.slotDate,
        totalTemplates: summary.totalTemplates,
        assigned: summary.assigned,
        alreadyAssigned: summary.alreadyAssigned,
        noBike: summary.noBike,
        billingFailed: summary.billingFailed,
        conflicts: summary.conflicts,
        skippedOutsideOperatingHours: summary.skippedOutsideOperatingHours,
      },
      "reservations.fixedSlotAssign completed",
    );
  };
}
