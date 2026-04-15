import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { enqueueOutboxJob } from "@/infrastructure/jobs/outbox-enqueue";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import logger from "@/lib/logger";

type EnvironmentImpactJobWriter = Pick<PrismaTypes.TransactionClient, "jobOutbox">;

export type EnvironmentImpactEnqueueResult =
  | "enqueued"
  | "already_queued"
  | "failed";

export function environmentImpactRentalDedupeKey(rentalId: string): string {
  return `environment-impact:rental:${rentalId}`;
}

export function enqueueEnvironmentImpactCalculationJob(
  client: EnvironmentImpactJobWriter,
  args: {
    readonly rentalId: string;
    readonly now?: Date;
  },
): Effect.Effect<EnvironmentImpactEnqueueResult> {
  return Effect.tryPromise({
    try: () =>
      enqueueOutboxJob(client, {
        type: JobTypes.EnvironmentImpactCalculateRental,
        payload: {
          version: 1,
          rentalId: args.rentalId,
        },
        runAt: args.now ?? new Date(),
        dedupeKey: environmentImpactRentalDedupeKey(args.rentalId),
      }),
    catch: err => err,
  }).pipe(
    Effect.as("enqueued" as const),
    Effect.catchAll(err =>
      Effect.sync(() => {
        if (isPrismaUniqueViolation(err)) {
          logger.info(
            {
              rentalId: args.rentalId,
              dedupeKey: environmentImpactRentalDedupeKey(args.rentalId),
            },
            "Environment impact calculation job already queued",
          );
          return "already_queued" as const;
        }

        logger.error(
          {
            err,
            rentalId: args.rentalId,
            dedupeKey: environmentImpactRentalDedupeKey(args.rentalId),
          },
          "Failed to enqueue environment impact calculation job",
        );
        return "failed" as const;
      })),
  );
}
