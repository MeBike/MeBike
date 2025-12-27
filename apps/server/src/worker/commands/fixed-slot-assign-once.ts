import { Effect, Layer } from "effect";
import process from "node:process";

import { BikeRepositoryLive } from "@/domain/bikes";
import { RentalRepositoryLive } from "@/domain/rentals";
import {
  assignFixedSlotReservationsUseCase,
  parseSlotDateKey,
  ReservationRepositoryLive,
} from "@/domain/reservations";
import { PrismaLive } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

async function main() {
  const dateArg = process.argv[2];
  const slotDate = dateArg ? parseSlotDateKey(dateArg) : undefined;

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
      slotDate: summary.slotDate,
      totalTemplates: summary.totalTemplates,
      assigned: summary.assigned,
      noBike: summary.noBike,
      missingReservation: summary.missingReservation,
      conflicts: summary.conflicts,
    },
    "fixed-slot-assign-once completed",
  );
}

main().catch((err) => {
  logger.error({ err }, "fixed-slot-assign-once failed");
  process.exit(1);
});
