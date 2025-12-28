import type { JobPayload } from "@mebike/shared/contracts/server/jobs";
import type { Job } from "pg-boss";

import { parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";
import process from "node:process";

import type { Prisma } from "@/infrastructure/prisma";

import { env } from "@/config/env";
import { db } from "@/database";
import {
  activateSubscriptionUseCase,
  SubscriptionRepositoryLive,
  SubscriptionServiceLive,
  SubscriptionServiceTag,
} from "@/domain/subscriptions";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { makePgBoss } from "@/infrastructure/jobs/pgboss";
import { PrismaLive } from "@/infrastructure/prisma";
import { makeEmailTransporter } from "@/lib/email";
import logger from "@/lib/logger";

import { handleEmailJob } from "./email-worker";
import { handleFixedSlotAssign } from "./fixed-slot-worker";
import { startOutboxDispatcher } from "./outbox-dispatcher";
import {
  handleReservationExpireHold,
  handleReservationNotifyNearExpiry,
} from "./reservation-hold-worker";
import { attachPgBossEventLogging, WorkerLog } from "./worker-logging";
import { setupDLQWorker, setupQueue } from "./worker-setup";
// run effect with required dependencies
function runSubscriptionEffect<A, E>(
  eff: Effect.Effect<A, E, SubscriptionServiceTag | Prisma>,
): Promise<A> {
  return Effect.runPromise(
    eff.pipe(
      Effect.provide(SubscriptionServiceLive),
      Effect.provide(SubscriptionRepositoryLive),
      Effect.provide(PrismaLive),
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

  await setupQueue(boss, JobTypes.EmailSend);
  await setupQueue(boss, JobTypes.SubscriptionAutoActivate);
  await setupQueue(boss, JobTypes.SubscriptionExpireSweep);
  await setupQueue(boss, JobTypes.ReservationFixedSlotAssign);
  await setupQueue(boss, JobTypes.ReservationNotifyNearExpiry);
  await setupQueue(boss, JobTypes.ReservationExpireHold);

  await boss.schedule(
    JobTypes.SubscriptionExpireSweep,
    "*/5 * * * *",
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(JobTypes.SubscriptionExpireSweep, "*/5 * * * *");
  await boss.schedule(
    JobTypes.ReservationFixedSlotAssign,
    env.FIXED_SLOT_ASSIGN_CRON,
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(
    JobTypes.ReservationFixedSlotAssign,
    env.FIXED_SLOT_ASSIGN_CRON,
  );

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

  const fixedSlotWorkerId = await boss.work(
    JobTypes.ReservationFixedSlotAssign,
    handleFixedSlotAssign,
  );
  WorkerLog.workerRegistered(JobTypes.ReservationFixedSlotAssign, fixedSlotWorkerId);

  const notifyWorkerId = await boss.work(
    JobTypes.ReservationNotifyNearExpiry,
    async (jobs) => {
      await handleReservationNotifyNearExpiry(jobs[0], boss);
    },
  );
  WorkerLog.workerRegistered(JobTypes.ReservationNotifyNearExpiry, notifyWorkerId);

  const expireWorkerId = await boss.work(
    JobTypes.ReservationExpireHold,
    async (jobs) => {
      await handleReservationExpireHold(jobs[0]);
    },
  );
  WorkerLog.workerRegistered(JobTypes.ReservationExpireHold, expireWorkerId);

  await setupDLQWorker(boss, JobTypes.EmailSend, "Email job");
  await setupDLQWorker(boss, JobTypes.SubscriptionAutoActivate, "Subscription auto-activate job");
  await setupDLQWorker(boss, JobTypes.ReservationFixedSlotAssign, "Fixed-slot assignment job");
  await setupDLQWorker(boss, JobTypes.ReservationNotifyNearExpiry, "Reservation near-expiry job");
  await setupDLQWorker(boss, JobTypes.ReservationExpireHold, "Reservation expire-hold job");

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
