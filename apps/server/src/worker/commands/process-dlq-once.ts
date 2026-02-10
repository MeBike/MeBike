import process from "node:process";

import { makePgBoss } from "@/infrastructure/jobs/pgboss";
import { listDlqQueues } from "@/infrastructure/jobs/queue-policy";
import logger from "@/lib/logger";
import { processDlqOnce } from "@/worker/dlq-worker";

import { attachPgBossEventLogging, WorkerLog } from "../worker-logging";

async function main() {
  const boss = makePgBoss();
  attachPgBossEventLogging(boss);
  await boss.start();

  const dlqArg = process.argv[2];
  const queues = dlqArg ? [dlqArg] : listDlqQueues();

  for (const queue of queues) {
    await boss.createQueue(queue);
    WorkerLog.queueEnsured(queue);
    const processed = await processDlqOnce(boss, queue);
    if (!processed) {
      WorkerLog.noJobs(queue);
    }
  }

  await boss.stop({ close: true });
}

main().catch((err) => {
  logger.error({ err }, "process-dlq-once failed");
  process.exit(1);
});
