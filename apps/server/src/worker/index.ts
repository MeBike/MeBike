import type { JobPayload } from "@mebike/shared/contracts/server/jobs";

import { parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";
import process from "node:process";

import type {
  SubscriptionQueryServiceTag,
} from "@/domain/subscriptions";
import type { JobScheduler, QueueJob } from "@/infrastructure/jobs/ports";
import type { Prisma } from "@/infrastructure/prisma";

import { env } from "@/config/env";
import { db } from "@/database";
import {
  activateSubscriptionUseCase,
  SubscriptionCommandRepositoryLive,
  SubscriptionCommandServiceLive,
  SubscriptionCommandServiceTag,
  SubscriptionQueryRepositoryLive,
  SubscriptionQueryServiceLive,
} from "@/domain/subscriptions";
import { makeJobBackend } from "@/infrastructure/jobs/backend";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { PrismaLive } from "@/infrastructure/prisma";
import { makeEmailTransporter } from "@/lib/email";
import logger from "@/lib/logger";

import { handleEmailJob } from "./email-worker";
import { handleEnvironmentImpactCalculateRental } from "./environment-impact-worker";
import { handleFixedSlotAssign } from "./fixed-slot-worker";
import { startOutboxDispatcher } from "./outbox-dispatcher";
import { handlePushSend } from "./push-worker";
import {
  handleReservationExpireHold,
  handleReservationNotifyNearExpiry,
} from "./reservation-hold-worker";
import { handleWithdrawalExecute, handleWithdrawalSweep } from "./wallet-withdrawal-worker";
import { attachJobRuntimeLogging, WorkerLog } from "./worker-logging";
import { setupQueue } from "./worker-setup";

function runSubscriptionEffect<A, E>(
  eff: Effect.Effect<
    A,
    E,
    SubscriptionQueryServiceTag | SubscriptionCommandServiceTag | Prisma
  >,
): Promise<A> {
  return Effect.runPromise(
    eff.pipe(
      Effect.provide(SubscriptionQueryServiceLive),
      Effect.provide(SubscriptionCommandServiceLive),
      Effect.provide(SubscriptionQueryRepositoryLive),
      Effect.provide(SubscriptionCommandRepositoryLive),
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
      const service = yield* SubscriptionCommandServiceTag;
      return yield* service.markExpiredNow(new Date());
    }),
  );
  logger.info(
    { jobId: job.id, expiredCount },
    "subscriptions.expireSweep completed",
  );
}

async function main() {
  const { producer, runtime, scheduler } = makeJobBackend();
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
  await setupQueue(runtime, JobTypes.EnvironmentImpactCalculateRental);
  await setupQueue(runtime, JobTypes.WalletWithdrawalExecute);
  await setupQueue(runtime, JobTypes.WalletWithdrawalSweep);

  await ensureSchedules(scheduler);

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

  const environmentImpactWorkerId = await runtime.register(
    JobTypes.EnvironmentImpactCalculateRental,
    handleEnvironmentImpactCalculateRental,
  );
  WorkerLog.workerRegistered(JobTypes.EnvironmentImpactCalculateRental, environmentImpactWorkerId);

  const withdrawalWorkerId = await runtime.register(JobTypes.WalletWithdrawalExecute, handleWithdrawalExecute);
  WorkerLog.workerRegistered(JobTypes.WalletWithdrawalExecute, withdrawalWorkerId);

  const withdrawalSweepWorkerId = await runtime.register(JobTypes.WalletWithdrawalSweep, handleWithdrawalSweep);
  WorkerLog.workerRegistered(JobTypes.WalletWithdrawalSweep, withdrawalSweepWorkerId);

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
  const fixedSlotScheduleTz = "Asia/Ho_Chi_Minh";

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
    { tz: fixedSlotScheduleTz },
  );
  WorkerLog.scheduleEnsured(
    JobTypes.ReservationFixedSlotAssign,
    `${env.FIXED_SLOT_ASSIGN_CRON} (${fixedSlotScheduleTz})`,
  );

  await scheduler.schedule(
    JobTypes.WalletWithdrawalSweep,
    env.WITHDRAWAL_SWEEP_CRON,
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(JobTypes.WalletWithdrawalSweep, env.WITHDRAWAL_SWEEP_CRON);
}
