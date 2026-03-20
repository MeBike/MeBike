import process from "node:process";

import { makePgBoss, makePgBossJobRuntime } from "@/infrastructure/jobs/pgboss";
import { listDlqQueues } from "@/infrastructure/jobs/queue-policy";
import logger from "@/lib/logger";
import { processDlqOnce } from "@/worker/dlq-worker";

import { attachJobRuntimeLogging, WorkerLog } from "../worker-logging";

async function main() {
  const boss = makePgBoss();
  const runtime = makePgBossJobRuntime(boss);
  attachJobRuntimeLogging(runtime);
  await runtime.start();

  const dlqArg = process.argv[2];
  const queues = dlqArg ? [dlqArg] : listDlqQueues();

  for (const queue of queues) {
    await runtime.ensureQueue(queue);
    WorkerLog.queueEnsured(queue);
    const processed = await processDlqOnce(boss, queue);
    if (!processed) {
      WorkerLog.noJobs(queue);
    }
  }

  await runtime.stop();
}

main().catch((err) => {
  logger.error({ err }, "process-dlq-once failed");
  process.exit(1);
});
