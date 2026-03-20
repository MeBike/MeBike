import type { JobPayload } from "@mebike/shared/contracts/server/jobs";

import { parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";
import process from "node:process";

import type { JobScheduler, QueueJob } from "@/infrastructure/jobs/ports";
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
import { makePgBoss, makePgBossJobProducer, makePgBossJobRuntime } from "@/infrastructure/jobs/pgboss";
import { PrismaLive } from "@/infrastructure/prisma";
import { makeEmailTransporter } from "@/lib/email";
import logger from "@/lib/logger";

import { handleEmailJob } from "./email-worker";
import { handleFixedSlotAssign } from "./fixed-slot-worker";
import { startOutboxDispatcher } from "./outbox-dispatcher";
import { handlePushSend } from "./push-worker";
import {
  handleReservationExpireHold,
  handleReservationNotifyNearExpiry,
} from "./reservation-hold-worker";
import { handleWithdrawalExecute, handleWithdrawalSweep } from "./wallet-withdrawal-worker";
import { attachJobRuntimeLogging, WorkerLog } from "./worker-logging";
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

async function handleAutoActivate(job: QueueJob | undefined) {
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

async function handleExpireSweep(job: QueueJob | undefined) {
  if (!job) {
    logger.warn("Expire-sweep worker received empty batch");
    return;
  }
  logger.info({ jobId: job.id }, "Handling subscriptions.expireSweep job");
  try {
    parseJobPayload(JobTypes.SubscriptionExpireSweep, job.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Invalid expire-sweep payload");
    throw err;
  }
  const expiredCount = await runSubscriptionEffect(
    Effect.gen(function* () {
      const service = yield* SubscriptionServiceTag;
      return yield* service.markExpiredNow(new Date());
    }),
  );
  logger.info(
    { jobId: job.id, expiredCount },
    "subscriptions.expireSweep completed",
  );
}

async function main() {
  const boss = makePgBoss();
  const producer = makePgBossJobProducer(boss);
  const runtime = makePgBossJobRuntime(boss);
  attachJobRuntimeLogging(runtime);
  await runtime.start();
  WorkerLog.runtimeStarted();

  const email = makeEmailTransporter({ fromName: "MeBike" });
  await email.transporter.verify();
  WorkerLog.emailVerified();

  await setupQueue(runtime, JobTypes.EmailSend);
  await setupQueue(runtime, JobTypes.PushSend);
  await setupQueue(runtime, JobTypes.SubscriptionAutoActivate);
  await setupQueue(runtime, JobTypes.SubscriptionExpireSweep);
  await setupQueue(runtime, JobTypes.ReservationFixedSlotAssign);
  await setupQueue(runtime, JobTypes.ReservationNotifyNearExpiry);
  await setupQueue(runtime, JobTypes.ReservationExpireHold);
  await setupQueue(runtime, JobTypes.WalletWithdrawalExecute);
  await setupQueue(runtime, JobTypes.WalletWithdrawalSweep);

  await ensureSchedules(runtime);

  const autoActivateWorkerId = await runtime.register(JobTypes.SubscriptionAutoActivate, handleAutoActivate);
  WorkerLog.workerRegistered(JobTypes.SubscriptionAutoActivate, autoActivateWorkerId);

  const expireSweepWorkerId = await runtime.register(JobTypes.SubscriptionExpireSweep, handleExpireSweep);
  WorkerLog.workerRegistered(JobTypes.SubscriptionExpireSweep, expireSweepWorkerId);

  const emailWorkerId = await runtime.register(JobTypes.EmailSend, async job => handleEmailJob(job, email));
  WorkerLog.workerRegistered(JobTypes.EmailSend, emailWorkerId);

  const pushWorkerId = await runtime.register(JobTypes.PushSend, handlePushSend);
  WorkerLog.workerRegistered(JobTypes.PushSend, pushWorkerId);

  const fixedSlotWorkerId = await runtime.register(JobTypes.ReservationFixedSlotAssign, handleFixedSlotAssign);
  WorkerLog.workerRegistered(JobTypes.ReservationFixedSlotAssign, fixedSlotWorkerId);

  const notifyWorkerId = await runtime.register(
    JobTypes.ReservationNotifyNearExpiry,
    async job => handleReservationNotifyNearExpiry(job, producer),
  );
  WorkerLog.workerRegistered(JobTypes.ReservationNotifyNearExpiry, notifyWorkerId);

  const expireWorkerId = await runtime.register(
    JobTypes.ReservationExpireHold,
    async job => handleReservationExpireHold(job, producer),
  );
  WorkerLog.workerRegistered(JobTypes.ReservationExpireHold, expireWorkerId);

  const withdrawalWorkerId = await runtime.register(JobTypes.WalletWithdrawalExecute, handleWithdrawalExecute);
  WorkerLog.workerRegistered(JobTypes.WalletWithdrawalExecute, withdrawalWorkerId);

  const withdrawalSweepWorkerId = await runtime.register(JobTypes.WalletWithdrawalSweep, handleWithdrawalSweep);
  WorkerLog.workerRegistered(JobTypes.WalletWithdrawalSweep, withdrawalSweepWorkerId);

  await setupDLQWorker(runtime, JobTypes.EmailSend, "Email job");
  await setupDLQWorker(runtime, JobTypes.PushSend, "Push notification job");
  await setupDLQWorker(runtime, JobTypes.SubscriptionAutoActivate, "Subscription auto-activate job");
  await setupDLQWorker(runtime, JobTypes.ReservationFixedSlotAssign, "Fixed-slot assignment job");
  await setupDLQWorker(runtime, JobTypes.ReservationNotifyNearExpiry, "Reservation near-expiry job");
  await setupDLQWorker(runtime, JobTypes.ReservationExpireHold, "Reservation expire-hold job");
  await setupDLQWorker(runtime, JobTypes.WalletWithdrawalExecute, "Wallet withdrawal execute job");
  await setupDLQWorker(runtime, JobTypes.WalletWithdrawalSweep, "Wallet withdrawal sweep job");

  const stopDispatcher = startOutboxDispatcher({
    db,
    producer,
    workerId: `worker-${process.pid}`,
  });
  WorkerLog.outboxDispatcherStarted();

  const shutdown = async (signal?: string) => {
    if (signal) {
      logger.info({ signal }, "Worker shutdown initiated");
    }
    stopDispatcher();
    await runtime.stopGracefully(30_000);
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

async function ensureSchedules(scheduler: JobScheduler) {
  await scheduler.schedule(
    JobTypes.SubscriptionExpireSweep,
    "*/5 * * * *",
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(JobTypes.SubscriptionExpireSweep, "*/5 * * * *");

  await scheduler.schedule(
    JobTypes.ReservationFixedSlotAssign,
    env.FIXED_SLOT_ASSIGN_CRON,
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(
    JobTypes.ReservationFixedSlotAssign,
    env.FIXED_SLOT_ASSIGN_CRON,
  );

  await scheduler.schedule(
    JobTypes.WalletWithdrawalSweep,
    env.WITHDRAWAL_SWEEP_CRON,
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(JobTypes.WalletWithdrawalSweep, env.WITHDRAWAL_SWEEP_CRON);
}
