import type { Kysely } from "kysely";
import type { PgBoss } from "pg-boss";

import type { OutboxRetryOptions } from "@/infrastructure/jobs/outbox";
import type { DB } from "generated/kysely/types";

import {
  claimOutboxJobs,
  markOutboxSent,

  rescheduleOutboxOnFailure,
} from "@/infrastructure/jobs/outbox";
import logger from "@/lib/logger";

type DispatcherOptions = {
  readonly db: Kysely<DB>;
  readonly boss: PgBoss;
  readonly workerId: string;
  readonly pollIntervalMs?: number;
  readonly batchSize?: number;
  readonly retryOptions?: Partial<OutboxRetryOptions>;
};

const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_BATCH_SIZE = 20;

function toBossData(payload: unknown): object | null | undefined { // who knows kund if data from outbox
  if (payload === undefined) {
    return undefined;
  }
  if (payload === null) {
    return null;
  }
  if (typeof payload === "object") {
    return payload;
  }
  return null;
}

export async function dispatchOutboxOnce(options: {
  readonly db: Kysely<DB>;
  readonly boss: PgBoss;
  readonly workerId: string;
  readonly batchSize?: number;
  readonly retryOptions?: Partial<OutboxRetryOptions>;
}): Promise<void> {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;

  const jobs = await claimOutboxJobs(options.db, {
    limit: batchSize,
    workerId: options.workerId,
  });

  if (jobs.length > 0) {
    logger.info(
      { workerId: options.workerId, count: jobs.length },
      "Claimed outbox jobs",
    );
  }

  for (const job of jobs) {
    try {
      logger.info(
        { jobId: job.id, jobType: job.type, attempts: job.attempts },
        "Dispatching outbox job to pg-boss",
      );
      await options.boss.send(job.type, toBossData(job.payload), {
        singletonKey: job.dedupeKey ?? undefined,
      });
      await markOutboxSent(options.db, {
        id: job.id,
        workerId: options.workerId,
      });
      logger.info(
        { jobId: job.id, jobType: job.type },
        "Outbox job dispatched and marked SENT",
      );
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        {
          jobId: job.id,
          jobType: job.type,
          error: message,
        },
        "Outbox dispatch failed",
      );
      const result = await rescheduleOutboxOnFailure(options.db, {
        id: job.id,
        workerId: options.workerId,
        error: message,
        attempts: job.attempts,
        retry: options.retryOptions,
      });

      if (result.outcome === "RESCHEDULED") {
        logger.warn(
          {
            jobId: job.id,
            jobType: job.type,
            attempts: job.attempts,
            maxAttempts: result.maxAttempts,
            nextRunAt: result.runAt.toISOString(),
          },
          "Outbox job rescheduled after dispatch failure",
        );
      }
      else {
        logger.error(
          {
            jobId: job.id,
            jobType: job.type,
            attempts: job.attempts,
            maxAttempts: result.maxAttempts,
          },
          "Outbox job marked FAILED (max attempts reached)",
        );
      }
    }
  }
}

export function startOutboxDispatcher(options: DispatcherOptions): () => void {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  let running = false;
  let stopped = false;

  const tick = async () => {
    if (running || stopped) {
      return;
    }
    running = true;
    try {
      await dispatchOutboxOnce({
        db: options.db,
        boss: options.boss,
        workerId: options.workerId,
        batchSize,
        retryOptions: options.retryOptions,
      });
    }
    finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, pollIntervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
