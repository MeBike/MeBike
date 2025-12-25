import type { JobPayload } from "@mebike/shared/contracts/server/jobs";
import type { Job } from "pg-boss";

import { parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";
import process from "node:process";

import { db } from "@/database";
import {
  activateSubscriptionUseCase,
  SubscriptionRepositoryLive,
  SubscriptionServiceLive,
  SubscriptionServiceTag,
} from "@/domain/subscriptions";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { makePgBoss } from "@/infrastructure/jobs/pgboss";
import { JobDeadLetters, resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";
import { Prisma } from "@/infrastructure/prisma";
import { makeEmailTransporter } from "@/lib/email";
import logger from "@/lib/logger";

import { handleEmailJob } from "./email-worker";
import { startOutboxDispatcher } from "./outbox-dispatcher";
import { attachPgBossEventLogging, WorkerLog } from "./worker-logging";
// run effect with required dependencies
function runSubscriptionEffect<A, E>(
  eff: Effect.Effect<A, E, SubscriptionServiceTag | Prisma>,
): Promise<A> {
  return Effect.runPromise(
    eff.pipe(
      Effect.provide(SubscriptionServiceLive),
      Effect.provide(SubscriptionRepositoryLive),
      Effect.provide(Prisma.Default),
    ),
  );
}

async function handleAutoActivate(jobs: ReadonlyArray<Job<unknown>>) {
  const job = jobs[0];
  if (!job) {
    logger.warn("Auto-activate worker received empty batch");
    return;
  }
  logger.info({ jobId: job.id }, "Handling subscriptions.autoActivate job");
  let payload: JobPayload<typeof JobTypes.SubscriptionAutoActivate>;
  try {
    payload = parseJobPayload(JobTypes.SubscriptionAutoActivate, job.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Invalid auto-activate payload");
    throw err;
  }

  await runSubscriptionEffect(
    activateSubscriptionUseCase({ subscriptionId: payload.subscriptionId }),
  );
  logger.info(
    { jobId: job.id, subscriptionId: payload.subscriptionId },
    "subscriptions.autoActivate completed",
  );
}

async function handleExpireSweep(jobs: ReadonlyArray<Job<unknown>>) {
  if (jobs.length === 0) {
    logger.warn("Expire-sweep worker received empty batch");
    return;
  }
  const job = jobs[0];
  logger.info({ jobId: job?.id }, "Handling subscriptions.expireSweep job");
  try {
    parseJobPayload(JobTypes.SubscriptionExpireSweep, job?.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job?.id, error: message }, "Invalid expire-sweep payload");
    throw err;
  }
  const expiredCount = await runSubscriptionEffect(
    Effect.gen(function* () {
      const service = yield* SubscriptionServiceTag;
      return yield* service.markExpiredNow(new Date());
    }),
  );
  logger.info(
    { jobId: job?.id, expiredCount },
    "subscriptions.expireSweep completed",
  );
}

async function main() {
  const boss = makePgBoss();
  attachPgBossEventLogging(boss);
  await boss.start();
  WorkerLog.bossStarted();

  const email = makeEmailTransporter({ fromName: "MeBike" });
  await email.transporter.verify();
  WorkerLog.emailVerified();

  const emailDlq = JobDeadLetters[JobTypes.EmailSend];
  if (emailDlq) {
    await boss.createQueue(emailDlq);
    WorkerLog.queueEnsured(emailDlq);
  }
  const autoActivateDlq = JobDeadLetters[JobTypes.SubscriptionAutoActivate];
  if (autoActivateDlq) {
    await boss.createQueue(autoActivateDlq);
    WorkerLog.queueEnsured(autoActivateDlq);
  }

  await boss.createQueue(
    JobTypes.SubscriptionAutoActivate,
    resolveQueueOptions(JobTypes.SubscriptionAutoActivate),
  );
  WorkerLog.queueEnsured(JobTypes.SubscriptionAutoActivate);
  await boss.createQueue(
    JobTypes.SubscriptionExpireSweep,
    resolveQueueOptions(JobTypes.SubscriptionExpireSweep),
  );
  WorkerLog.queueEnsured(JobTypes.SubscriptionExpireSweep);
  await boss.createQueue(
    JobTypes.EmailSend,
    resolveQueueOptions(JobTypes.EmailSend),
  );
  WorkerLog.queueEnsured(JobTypes.EmailSend);

  await boss.schedule(
    JobTypes.SubscriptionExpireSweep,
    "*/5 * * * *",
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(JobTypes.SubscriptionExpireSweep, "*/5 * * * *");

  const autoActivateWorkerId = await boss.work(
    JobTypes.SubscriptionAutoActivate,
    handleAutoActivate,
  );
  WorkerLog.workerRegistered(JobTypes.SubscriptionAutoActivate, autoActivateWorkerId);

  const expireSweepWorkerId = await boss.work(
    JobTypes.SubscriptionExpireSweep,
    handleExpireSweep,
  );
  WorkerLog.workerRegistered(JobTypes.SubscriptionExpireSweep, expireSweepWorkerId);

  const emailWorkerId = await boss.work(JobTypes.EmailSend, async (jobs) => {
    await handleEmailJob(jobs[0], email);
  });
  WorkerLog.workerRegistered(JobTypes.EmailSend, emailWorkerId);

  if (emailDlq) {
    const dlqWorkerId = await boss.work(
      emailDlq,
      async (jobs) => {
        const job = jobs[0];
        logger.error(
          { jobId: job?.id, data: job?.data },
          "Email job moved to DLQ",
        );
      },
    );
    WorkerLog.workerRegistered(emailDlq, dlqWorkerId);
  }

  if (autoActivateDlq) {
    const dlqWorkerId = await boss.work(
      autoActivateDlq,
      async (jobs) => {
        const job = jobs[0];
        logger.error(
          { jobId: job?.id, data: job?.data },
          "Subscription auto-activate job moved to DLQ",
        );
      },
    );
    WorkerLog.workerRegistered(autoActivateDlq, dlqWorkerId);
  }

  const stopDispatcher = startOutboxDispatcher({
    db,
    boss,
    workerId: `worker-${process.pid}`,
  });
  WorkerLog.outboxDispatcherStarted();

  const shutdown = async (signal?: string) => {
    if (signal) {
      logger.info({ signal }, "Worker shutdown initiated");
    }
    stopDispatcher();
    await boss.stop({ graceful: true, timeout: 30_000 });
    if (typeof email.transporter.close === "function") {
      email.transporter.close();
    }
    await db.destroy();
  };

  process.on("SIGINT", () =>
    void shutdown("SIGINT").finally(() => process.exit(0)));
  process.on("SIGTERM", () =>
    void shutdown("SIGTERM").finally(() => process.exit(0)));

  logger.info("Worker started");
}

main().catch((err) => {
  logger.error({ err }, "Worker failed to start");
  process.exit(1);
});
