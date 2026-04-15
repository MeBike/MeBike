import { Effect } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

import {
  enqueueEnvironmentImpactCalculationJob,
} from "@/domain/rentals/services/environment-impact-job.service";

import type { EnvironmentImpactRepairRepo } from "../repository/environment-impact-repair.repository";
import type {
  RepairMissingEnvironmentImpactJobsInput,
  RepairMissingEnvironmentImpactJobsSummary,
} from "../models";

type EnvironmentImpactRepairJobWriter = Pick<
  PrismaTypes.TransactionClient,
  "jobOutbox"
>;

export function repairMissingEnvironmentImpactJobs(
  client: EnvironmentImpactRepairJobWriter,
  repo: EnvironmentImpactRepairRepo,
  input: RepairMissingEnvironmentImpactJobsInput,
): Effect.Effect<RepairMissingEnvironmentImpactJobsSummary> {
  return Effect.gen(function* () {
    const rentals = yield* repo
      .listCompletedRentalsMissingEnvironmentImpact(input);

    const summary: RepairMissingEnvironmentImpactJobsSummary = {
      scanned: rentals.length,
      found: rentals.length,
      attempted: 0,
      enqueued: 0,
      alreadyQueued: 0,
      failed: 0,
    };

    for (const rental of rentals) {
      summary.attempted += 1;
      const result = yield* enqueueEnvironmentImpactCalculationJob(client, {
        rentalId: rental.id,
      });

      switch (result) {
        case "enqueued":
          summary.enqueued += 1;
          break;
        case "already_queued":
          summary.alreadyQueued += 1;
          break;
        case "failed":
          summary.failed += 1;
          break;
      }
    }

    return summary;
  });
}
