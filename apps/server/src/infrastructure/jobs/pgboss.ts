import type { Job as PgBossJob } from "pg-boss";

import { PgBoss } from "pg-boss";

import { env } from "@/config/env";

import type { JobProducer, JobRuntime, JobScheduler, QueueJob } from "./ports";

export function makePgBoss(): PgBoss {
  return new PgBoss({
    connectionString: env.DATABASE_URL,
  });
}

export function makePgBossJobProducer(boss: PgBoss): JobProducer {
  return {
    send(type, payload, options) {
      return boss.send(type, payload, {
        singletonKey: options?.dedupeKey,
      });
    },
  };
}

export function makePgBossJobRuntime(boss: PgBoss): JobRuntime & JobScheduler {
  return {
    start() {
      return boss.start().then(() => undefined);
    },
    stop() {
      return boss.stop({ close: true });
    },
    stopGracefully(timeoutMs) {
      return boss.stop({ graceful: true, timeout: timeoutMs });
    },
    onError(handler) {
      boss.on("error", handler);
    },
    onWarning(handler) {
      boss.on("warning", handler);
    },
    ensureQueue(queue, options) {
      return boss.createQueue(queue, options);
    },
    register(queue, handler) {
      return boss.work(queue, { batchSize: 1 }, async (jobs) => {
        await handler(toQueueJob(jobs[0]));
      });
    },
    async fetchOne(queue) {
      const jobs = await boss.fetch(queue, { batchSize: 1 });
      return toQueueJob(jobs[0]);
    },
    complete(queue, jobId) {
      return boss.complete(queue, jobId).then(() => undefined);
    },
    fail(queue, jobId, error) {
      return boss.fail(queue, jobId, { message: error }).then(() => undefined);
    },
    schedule(type, cron, payload) {
      return boss.schedule(type, cron, payload);
    },
  };
}

export function toQueueJob<TData>(job: PgBossJob<TData> | undefined): QueueJob<TData> | undefined {
  if (!job) {
    return undefined;
  }

  return {
    id: job.id,
    data: job.data,
  };
}
