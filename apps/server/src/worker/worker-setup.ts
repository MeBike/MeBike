import type { JobType } from "@mebike/shared/contracts/server/jobs";

import type { JobRuntime } from "@/infrastructure/jobs/ports";

import { JobDeadLetters, resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";
import logger from "@/lib/logger";

import { WorkerLog } from "./worker-logging";

/**
 * EN: Setup a job queue with its configured options and optional DLQ.
 * VI: Thiết lập queue cho job với cấu hình và DLQ tùy chọn.
 */
export async function setupQueue(
  runtime: JobRuntime,
  jobType: JobType,
): Promise<void> {
  // Create DLQ if configured
  const dlq = JobDeadLetters[jobType];
  if (dlq) {
    await runtime.ensureQueue(dlq);
    WorkerLog.queueEnsured(dlq);
  }

  // Create main queue
  await runtime.ensureQueue(jobType, resolveQueueOptions(jobType));
  WorkerLog.queueEnsured(jobType);
}

/**
 * EN: Register a DLQ worker that logs failed jobs.
 * VI: Đăng ký worker DLQ để ghi log các job thất bại.
 */
export async function setupDLQWorker(
  runtime: JobRuntime,
  jobType: JobType,
  jobDescription: string,
): Promise<void> {
  const dlq = JobDeadLetters[jobType];
  if (!dlq)
    return;

  const workerId = await runtime.register(dlq, async (job) => {
    logger.error(
      { jobId: job?.id, data: job?.data },
      `${jobDescription} moved to DLQ`,
    );
  });
  WorkerLog.workerRegistered(dlq, workerId);
}
