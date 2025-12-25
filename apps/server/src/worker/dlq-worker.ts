import type { Job, PgBoss } from "pg-boss";

import logger from "@/lib/logger";

export type DlqJobHandler = (job: Job<unknown>) => Promise<void> | void;

export async function processDlqOnce(
  boss: PgBoss,
  queue: string,
  handler?: DlqJobHandler,
): Promise<boolean> {
  const jobs = await boss.fetch(queue, { batchSize: 1 });
  const job = jobs[0];
  if (!job) {
    return false;
  }

  try {
    logger.error({ queue, jobId: job.id, data: job.data }, "DLQ job received");
    if (handler) {
      await handler(job);
    }
    await boss.complete(queue, job.id);
    logger.info({ queue, jobId: job.id }, "DLQ job completed");
    return true;
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ queue, jobId: job.id, error: message }, "DLQ job failed");
    await boss.fail(queue, job.id, { message });
    throw err;
  }
}
