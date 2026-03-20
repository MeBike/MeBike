import type { JobRuntime } from "@/infrastructure/jobs/ports";

import logger from "@/lib/logger";

export function attachJobRuntimeLogging(runtime: JobRuntime) {
  runtime.onError(err => logger.error({ err }, "job runtime error"));
  runtime.onWarning(warning => logger.warn({ warning }, "job runtime warning"));
}

export const attachPgBossEventLogging = attachJobRuntimeLogging;

export const WorkerLog = {
  runtimeStarted: () => logger.info("Job runtime started"),
  emailVerified: () => logger.info("Email transporter verified"),
  queueEnsured: (queue: string) => logger.info({ queue }, "Queue ensured"),
  scheduleEnsured: (queue: string, cron: string) =>
    logger.info({ queue, cron }, "Schedule ensured"),
  workerRegistered: (queue: string, workerId: string) =>
    logger.info({ queue, workerId }, "Worker registered"),
  outboxDispatcherStarted: () => logger.info("Outbox dispatcher started"),
  processingOnce: (queue: string, jobId: string) =>
    logger.info({ queue, jobId }, "Processing job once"),
  completedOnce: (queue: string, jobId: string) =>
    logger.info({ queue, jobId }, "Job completed"),
  failedOnce: (queue: string, jobId: string, error: string) =>
    logger.error({ queue, jobId, error }, "Job failed"),
  noJobs: (queue: string) => logger.info({ queue }, "No jobs to process"),
} as const;
