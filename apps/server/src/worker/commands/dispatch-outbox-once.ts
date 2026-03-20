import process from "node:process";

import { db } from "@/database";
import { makePgBoss, makePgBossJobProducer, makePgBossJobRuntime } from "@/infrastructure/jobs/pgboss";
import logger from "@/lib/logger";

import { dispatchOutboxOnce } from "../outbox-dispatcher";

async function main() {
  const boss = makePgBoss();
  const producer = makePgBossJobProducer(boss);
  const runtime = makePgBossJobRuntime(boss);
  await runtime.start();

  await dispatchOutboxOnce({
    db,
    producer,
    workerId: `dispatch-once-${process.pid}`,
  });

  await runtime.stop();
  await db.destroy();
}

main().catch((err) => {
  logger.error({ err }, "dispatch-outbox-once failed");
  process.exit(1);
});
