import process from "node:process";

import { db } from "@/database";
import { makePgBoss } from "@/infrastructure/jobs/pgboss";
import logger from "@/lib/logger";

import { dispatchOutboxOnce } from "../outbox-dispatcher";

async function main() {
  const boss = makePgBoss();
  await boss.start();

  await dispatchOutboxOnce({
    db,
    boss,
    workerId: `dispatch-once-${process.pid}`,
  });

  await boss.stop({ close: true });
  await db.destroy();
}

main().catch((err) => {
  logger.error({ err }, "dispatch-outbox-once failed");
  process.exit(1);
});
