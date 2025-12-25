import type { Job } from "pg-boss";

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
import { resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";
import { Prisma } from "@/infrastructure/prisma";
import { makeEmailTransporter } from "@/lib/email";
import logger from "@/lib/logger";

import { handleEmailJob } from "./email-worker";
import { startOutboxDispatcher } from "./outbox-dispatcher";
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
  // for first job check data for subscriptionId then run activate use case with deps of course
  const data = job?.data;
  const subscriptionId
    = typeof data === "object" && data !== null
      ? (data as { subscriptionId?: unknown }).subscriptionId
      : undefined;

  if (typeof subscriptionId !== "string" || subscriptionId.length === 0) {
    logger.error({ jobId: job?.id }, "Missing subscriptionId for auto-activate job");
    return;
  }

  await runSubscriptionEffect(activateSubscriptionUseCase({ subscriptionId }));
  logger.info(
    { jobId: job.id, subscriptionId },
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
  boss.on("error", err => logger.error({ err }, "pg-boss error"));
  boss.on("warning", warning => logger.warn({ warning }, "pg-boss warning"));
  await boss.start();
  logger.info("pg-boss started");

  const email = makeEmailTransporter({ fromName: "MeBike" });
  await email.transporter.verify();
  logger.info("Email transporter verified");

  await boss.createQueue(
    JobTypes.SubscriptionAutoActivate,
    resolveQueueOptions(JobTypes.SubscriptionAutoActivate),
  );
  logger.info({ queue: JobTypes.SubscriptionAutoActivate }, "Queue ensured");
  await boss.createQueue(
    JobTypes.SubscriptionExpireSweep,
    resolveQueueOptions(JobTypes.SubscriptionExpireSweep),
  );
  logger.info({ queue: JobTypes.SubscriptionExpireSweep }, "Queue ensured");
  await boss.createQueue(
    JobTypes.EmailSend,
    resolveQueueOptions(JobTypes.EmailSend),
  );
  logger.info({ queue: JobTypes.EmailSend }, "Queue ensured");

  await boss.schedule(JobTypes.SubscriptionExpireSweep, "*/5 * * * *");
  logger.info(
    { queue: JobTypes.SubscriptionExpireSweep, cron: "*/5 * * * *" },
    "Schedule ensured",
  );

  const autoActivateWorkerId = await boss.work(
    JobTypes.SubscriptionAutoActivate,
    handleAutoActivate,
  );
  logger.info(
    { queue: JobTypes.SubscriptionAutoActivate, workerId: autoActivateWorkerId },
    "Worker registered",
  );

  const expireSweepWorkerId = await boss.work(
    JobTypes.SubscriptionExpireSweep,
    handleExpireSweep,
  );
  logger.info(
    { queue: JobTypes.SubscriptionExpireSweep, workerId: expireSweepWorkerId },
    "Worker registered",
  );

  const emailWorkerId = await boss.work(JobTypes.EmailSend, async (jobs) => {
    await handleEmailJob(jobs[0], email);
  });
  logger.info(
    { queue: JobTypes.EmailSend, workerId: emailWorkerId },
    "Worker registered",
  );

  const stopDispatcher = startOutboxDispatcher({
    db,
    boss,
    workerId: `worker-${process.pid}`,
  });
  logger.info("Outbox dispatcher started");

  const shutdown = async () => {
    stopDispatcher();
    await boss.stop({ close: true });
    if (typeof email.transporter.close === "function") {
      email.transporter.close();
    }
    await db.destroy();
  };

  process.on("SIGINT", () => void shutdown().finally(() => process.exit(0)));
  process.on("SIGTERM", () => void shutdown().finally(() => process.exit(0)));

  logger.info("Worker started");
}

main().catch((err) => {
  logger.error({ err }, "Worker failed to start");
  process.exit(1);
});
