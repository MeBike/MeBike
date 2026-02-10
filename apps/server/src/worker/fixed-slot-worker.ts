import type { Job } from "pg-boss";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Layer } from "effect";

import { BikeRepositoryLive } from "@/domain/bikes";
import { RentalRepositoryLive } from "@/domain/rentals";
import {
  assignFixedSlotReservationsUseCase,
  parseSlotDateKey,
  ReservationRepositoryLive,
} from "@/domain/reservations";
import { PrismaLive } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

export async function handleFixedSlotAssign(
  jobs: ReadonlyArray<Job<unknown>>,
): Promise<void> {
  const job = jobs[0];
  if (!job) {
    logger.warn("Fixed-slot worker received empty batch");
    return;
  }

  const payload = parseJobPayload(JobTypes.ReservationFixedSlotAssign, job.data);
  const slotDate = payload.slotDate ? parseSlotDateKey(payload.slotDate) : undefined;

  const depsLayer = Layer.mergeAll(
    PrismaLive,
    ReservationRepositoryLive.pipe(Layer.provide(PrismaLive)),
    BikeRepositoryLive.pipe(Layer.provide(PrismaLive)),
    RentalRepositoryLive.pipe(Layer.provide(PrismaLive)),
  );

  const summary = await Effect.runPromise(
    assignFixedSlotReservationsUseCase({
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
      noBike: summary.noBike,
      missingReservation: summary.missingReservation,
      conflicts: summary.conflicts,
    },
    "reservations.fixedSlotAssign completed",
  );
}
