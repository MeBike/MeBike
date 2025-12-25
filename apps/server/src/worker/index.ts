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
import { Prisma } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

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
}

async function handleExpireSweep(jobs: ReadonlyArray<Job<unknown>>) {
  void jobs;
  await runSubscriptionEffect(
    Effect.gen(function* () {
      const service = yield* SubscriptionServiceTag;
      return yield* service.markExpiredNow(new Date());
    }),
  );
}

async function main() {
  const boss = makePgBoss();
  await boss.start();

  await boss.schedule(JobTypes.SubscriptionExpireSweep, "*/5 * * * *");

  await boss.work(JobTypes.SubscriptionAutoActivate, handleAutoActivate);
  await boss.work(JobTypes.SubscriptionExpireSweep, handleExpireSweep);

  const stopDispatcher = startOutboxDispatcher({
    db,
    boss,
    workerId: `worker-${process.pid}`,
  });

  const shutdown = async () => {
    stopDispatcher();
    await boss.stop({ close: true });
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
