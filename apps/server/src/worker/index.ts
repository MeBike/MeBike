import type { JobPayload } from "@mebike/shared/contracts/server/jobs";

import { parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, ManagedRuntime } from "effect";
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
  SubscriptionCommandServiceTag,
} from "@/domain/subscriptions";
import { makeJobBackend } from "@/infrastructure/jobs/backend";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { makeEmailTransporter } from "@/lib/email";
import logger from "@/lib/logger";

import type { WorkerEffectRunner } from "./worker-runtime";

import { handleEmailJob } from "./email-worker";
import { makeEnvironmentImpactCalculateRentalHandler } from "./environment-impact-worker";
import { makeFixedSlotAssignHandler } from "./fixed-slot-worker";
import { startOutboxDispatcher } from "./outbox-dispatcher";
import { makeRentalOverdueSweepHandler } from "./rental-overdue-worker";
import {
  makeReservationExpireHoldHandler,
  makeReservationNotifyNearExpiryHandler,
} from "./reservation-hold/index";
import { makeReturnSlotExpireSweepHandler } from "./return-slot-expiry-worker";
import { makeTopupReconciliationSweepHandler } from "./wallet-topup-reconciliation-worker";
import { makeWithdrawalExecuteHandler, makeWithdrawalSweepHandler } from "./wallet-withdrawal-worker";
import { attachJobRuntimeLogging, WorkerLog } from "./worker-logging";
import { WorkerRuntimeLive } from "./worker-runtime";
import { setupQueue } from "./worker-setup";

function runSubscriptionEffect<A, E>(
  runEffect: WorkerEffectRunner,
  eff: Effect.Effect<
    A,
    E,
    SubscriptionQueryServiceTag | SubscriptionCommandServiceTag | Prisma
  >,
): Promise<A> {
  return runEffect(eff);
}

function makeAutoActivateHandler(runEffect: WorkerEffectRunner) {
  return async function handleAutoActivate(job: QueueJob | undefined) {
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
      runEffect,
      activateSubscriptionUseCase({ subscriptionId: payload.subscriptionId }),
    );
    logger.info(
      { jobId: job.id, subscriptionId: payload.subscriptionId },
      "subscriptions.autoActivate completed",
    );
  };
}

function makeExpireSweepHandler(runEffect: WorkerEffectRunner) {
  return async function handleExpireSweep(job: QueueJob | undefined) {
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
      runEffect,
      Effect.gen(function* () {
        const service = yield* SubscriptionCommandServiceTag;
        return yield* service.markExpiredNow(new Date());
      }),
    );
    logger.info(
      { jobId: job.id, expiredCount },
      "subscriptions.expireSweep completed",
    );
  };
}

async function main() {
  const { producer, runtime, scheduler } = makeJobBackend();
  const workerRuntime = ManagedRuntime.make(WorkerRuntimeLive);
  const runWorkerEffect: WorkerEffectRunner = effect => workerRuntime.runPromise(effect);
  attachJobRuntimeLogging(runtime);
  await runtime.start();
  WorkerLog.runtimeStarted();

  const email = makeEmailTransporter({ fromName: "MeBike" });
  await email.transporter.verify();
  WorkerLog.emailVerified();

  await setupQueue(runtime, JobTypes.EmailSend);
  await setupQueue(runtime, JobTypes.SubscriptionAutoActivate);
  await setupQueue(runtime, JobTypes.SubscriptionExpireSweep);
  await setupQueue(runtime, JobTypes.ReservationFixedSlotAssign);
  await setupQueue(runtime, JobTypes.ReservationNotifyNearExpiry);
  await setupQueue(runtime, JobTypes.ReservationExpireHold);
  await setupQueue(runtime, JobTypes.ReturnSlotExpireSweep);
  await setupQueue(runtime, JobTypes.EnvironmentImpactCalculateRental);
  await setupQueue(runtime, JobTypes.RentalOverdueSweep);
  await setupQueue(runtime, JobTypes.WalletTopupReconcileSweep);
  await setupQueue(runtime, JobTypes.WalletWithdrawalExecute);
  await setupQueue(runtime, JobTypes.WalletWithdrawalSweep);

  await ensureSchedules(scheduler);

  const autoActivateWorkerId = await runtime.register(
    JobTypes.SubscriptionAutoActivate,
    makeAutoActivateHandler(runWorkerEffect),
  );
  WorkerLog.workerRegistered(JobTypes.SubscriptionAutoActivate, autoActivateWorkerId);

  const expireSweepWorkerId = await runtime.register(
    JobTypes.SubscriptionExpireSweep,
    makeExpireSweepHandler(runWorkerEffect),
  );
  WorkerLog.workerRegistered(JobTypes.SubscriptionExpireSweep, expireSweepWorkerId);

  const emailWorkerId = await runtime.register(JobTypes.EmailSend, async job => handleEmailJob(job, email));
  WorkerLog.workerRegistered(JobTypes.EmailSend, emailWorkerId);

  const fixedSlotWorkerId = await runtime.register(
    JobTypes.ReservationFixedSlotAssign,
    makeFixedSlotAssignHandler(runWorkerEffect),
  );
  WorkerLog.workerRegistered(JobTypes.ReservationFixedSlotAssign, fixedSlotWorkerId);

  const notifyWorkerId = await runtime.register(
    JobTypes.ReservationNotifyNearExpiry,
    makeReservationNotifyNearExpiryHandler(runWorkerEffect, producer),
  );
  WorkerLog.workerRegistered(JobTypes.ReservationNotifyNearExpiry, notifyWorkerId);

  const expireWorkerId = await runtime.register(
    JobTypes.ReservationExpireHold,
    makeReservationExpireHoldHandler(runWorkerEffect, producer),
  );
  WorkerLog.workerRegistered(JobTypes.ReservationExpireHold, expireWorkerId);

  const returnSlotExpireWorkerId = await runtime.register(
    JobTypes.ReturnSlotExpireSweep,
    makeReturnSlotExpireSweepHandler(runWorkerEffect),
  );
  WorkerLog.workerRegistered(JobTypes.ReturnSlotExpireSweep, returnSlotExpireWorkerId);

  const environmentImpactWorkerId = await runtime.register(
    JobTypes.EnvironmentImpactCalculateRental,
    makeEnvironmentImpactCalculateRentalHandler(runWorkerEffect),
  );
  WorkerLog.workerRegistered(JobTypes.EnvironmentImpactCalculateRental, environmentImpactWorkerId);

  const overdueSweepWorkerId = await runtime.register(
    JobTypes.RentalOverdueSweep,
    makeRentalOverdueSweepHandler(runWorkerEffect),
  );
  WorkerLog.workerRegistered(JobTypes.RentalOverdueSweep, overdueSweepWorkerId);

  const withdrawalWorkerId = await runtime.register(
    JobTypes.WalletWithdrawalExecute,
    makeWithdrawalExecuteHandler(runWorkerEffect),
  );
  WorkerLog.workerRegistered(JobTypes.WalletWithdrawalExecute, withdrawalWorkerId);

  const topupReconcileSweepWorkerId = await runtime.register(
    JobTypes.WalletTopupReconcileSweep,
    makeTopupReconciliationSweepHandler(runWorkerEffect),
  );
  WorkerLog.workerRegistered(JobTypes.WalletTopupReconcileSweep, topupReconcileSweepWorkerId);

  const withdrawalSweepWorkerId = await runtime.register(
    JobTypes.WalletWithdrawalSweep,
    makeWithdrawalSweepHandler(runWorkerEffect),
  );
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
    await workerRuntime.dispose();
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
    JobTypes.WalletTopupReconcileSweep,
    env.TOPUP_RECONCILE_SWEEP_CRON,
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(JobTypes.WalletTopupReconcileSweep, env.TOPUP_RECONCILE_SWEEP_CRON);

  await scheduler.schedule(
    JobTypes.WalletWithdrawalSweep,
    env.WITHDRAWAL_SWEEP_CRON,
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(JobTypes.WalletWithdrawalSweep, env.WITHDRAWAL_SWEEP_CRON);

  await scheduler.schedule(
    JobTypes.ReturnSlotExpireSweep,
    env.RETURN_SLOT_EXPIRE_SWEEP_CRON,
    { version: 1 },
  );
  WorkerLog.scheduleEnsured(JobTypes.ReturnSlotExpireSweep, env.RETURN_SLOT_EXPIRE_SWEEP_CRON);

  await scheduler.schedule(
    JobTypes.RentalOverdueSweep,
    "* * * * *",
    { version: 1 },
    { tz: fixedSlotScheduleTz },
  );
  WorkerLog.scheduleEnsured(JobTypes.RentalOverdueSweep, `* * * * * (${fixedSlotScheduleTz})`);
}
