import type { JobType } from "@mebike/shared/contracts/server/jobs";

import type { JobRuntime } from "@/infrastructure/jobs/ports";

import { resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";

import { WorkerLog } from "./worker-logging";

/**
 * EN: Setup a job queue with its configured retry options.
 * VI: Thiết lập queue cho job với cấu hình retry.
 */
export async function setupQueue(
  runtime: JobRuntime,
  jobType: JobType,
): Promise<void> {
  await runtime.ensureQueue(jobType, resolveQueueOptions(jobType));
  WorkerLog.queueEnsured(jobType);
}
