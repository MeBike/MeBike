import type { JobType } from "@mebike/shared/contracts/server/jobs";
import type { Job, PgBoss } from "pg-boss";

import { JobDeadLetters, resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";
import logger from "@/lib/logger";

import { WorkerLog } from "./worker-logging";

/**
 * EN: Setup a job queue with its configured options and optional DLQ.
 * VI: Thiết lập queue cho job với cấu hình và DLQ tùy chọn.
 */
export async function setupQueue(
  boss: PgBoss,
  jobType: JobType,
): Promise<void> {
  // Create main queue
  await boss.createQueue(jobType, resolveQueueOptions(jobType));
  WorkerLog.queueEnsured(jobType);

  // Create DLQ if configured
  const dlq = JobDeadLetters[jobType];
  if (dlq) {
    await boss.createQueue(dlq);
    WorkerLog.queueEnsured(dlq);
  }
}

/**
 * EN: Register a DLQ worker that logs failed jobs.
 * VI: Đăng ký worker DLQ để ghi log các job thất bại.
 */
export async function setupDLQWorker(
  boss: PgBoss,
  jobType: JobType,
  jobDescription: string,
): Promise<void> {
  const dlq = JobDeadLetters[jobType];
  if (!dlq)
    return;

  const workerId = await boss.work(dlq, async (jobs: ReadonlyArray<Job<unknown>>) => {
    const job = jobs[0];
    logger.error(
      { jobId: job?.id, data: job?.data },
      `${jobDescription} moved to DLQ`,
    );
  });
  WorkerLog.workerRegistered(dlq, workerId);
}
