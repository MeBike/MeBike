import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Layer } from "effect";

import type { QueueJob } from "@/infrastructure/jobs/ports";

import { BikeRepositoryLive } from "@/domain/bikes";
import {
  assignFixedSlotReservations,
  parseSlotDateKey,
} from "@/domain/reservations";
import { PrismaLive } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

export async function handleFixedSlotAssign(
  job: QueueJob | undefined,
): Promise<void> {
  if (!job) {
    logger.warn("Fixed-slot worker received empty batch");
    return;
  }

  const payload = parseJobPayload(JobTypes.ReservationFixedSlotAssign, job.data);
  const slotDate = payload.slotDate ? parseSlotDateKey(payload.slotDate) : undefined;

  const depsLayer = Layer.mergeAll(
    PrismaLive,
    BikeRepositoryLive.pipe(Layer.provide(PrismaLive)),
  );

  const summary = await Effect.runPromise(
    assignFixedSlotReservations({
      slotDate,
      assignmentTime: new Date(),
    }).pipe(
      Effect.provide(depsLayer),
    ),
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
    },
    "reservations.fixedSlotAssign completed",
  );
}
