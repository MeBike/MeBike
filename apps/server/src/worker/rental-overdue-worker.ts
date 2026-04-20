import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";

import type { QueueJob } from "@/infrastructure/jobs/ports";

import { sweepOverdueRentals } from "@/domain/rentals/services/workers/rental-overdue-sweep.service";
import logger from "@/lib/logger";
import { makePrismaClient } from "@/lib/prisma";

export async function handleRentalOverdueSweep(job: QueueJob | undefined): Promise<void> {
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

  const prisma = makePrismaClient();

  try {
    await prisma.$connect();
    const summary = await sweepOverdueRentals(prisma, new Date());
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
  }
  finally {
    await prisma.$disconnect();
  }
}
