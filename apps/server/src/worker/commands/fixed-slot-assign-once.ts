import { Effect, Layer } from "effect";
import process from "node:process";

import { BikeRepositoryLive } from "@/domain/bikes";
import {
  assignFixedSlotReservations,
  parseSlotDateKey,
} from "@/domain/reservations";
import { PrismaLive } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

async function main() {
  const dateArg = process.argv[2];
  const slotDate = dateArg ? parseSlotDateKey(dateArg) : undefined;

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
      slotDate: summary.slotDate,
      totalTemplates: summary.totalTemplates,
      assigned: summary.assigned,
      alreadyAssigned: summary.alreadyAssigned,
      noBike: summary.noBike,
      billingFailed: summary.billingFailed,
      conflicts: summary.conflicts,
      skippedOutsideOperatingHours: summary.skippedOutsideOperatingHours,
    },
    "fixed-slot-assign-once completed",
  );
}

main().catch((err) => {
  logger.error({ err }, "fixed-slot-assign-once failed");
  process.exit(1);
});
