import process from "node:process";

import { db } from "@/database";
import { makeJobBackend } from "@/infrastructure/jobs/backend";
import logger from "@/lib/logger";

import { dispatchOutboxOnce } from "../outbox-dispatcher";

async function main() {
  const { producer, runtime } = makeJobBackend();
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
