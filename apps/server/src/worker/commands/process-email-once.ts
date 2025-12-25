import process from "node:process";

import { JobTypes } from "@/infrastructure/jobs/job-types";
import { makePgBoss } from "@/infrastructure/jobs/pgboss";
import { resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";
import { makeEmailTransporter } from "@/lib/email";
import logger from "@/lib/logger";

import { handleEmailJob } from "../email-worker";
import { attachPgBossEventLogging, WorkerLog } from "../worker-logging";

async function main() {
  const boss = makePgBoss();
  attachPgBossEventLogging(boss);
  await boss.start();
  await boss.createQueue(
    JobTypes.EmailSend,
    resolveQueueOptions(JobTypes.EmailSend),
  );
  WorkerLog.queueEnsured(JobTypes.EmailSend);

  const email = makeEmailTransporter({ fromName: "MeBike" });
  await email.transporter.verify();
  WorkerLog.emailVerified();

  const jobs = await boss.fetch(JobTypes.EmailSend, { batchSize: 1 });
  const job = jobs[0];
  if (!job) {
    WorkerLog.noJobs(JobTypes.EmailSend);
    await boss.stop({ close: true });
    if (typeof email.transporter.close === "function") {
      email.transporter.close();
    }
    return;
  }

  try {
    WorkerLog.processingOnce(JobTypes.EmailSend, job.id);
    await handleEmailJob(job, email);
    await boss.complete(JobTypes.EmailSend, job.id);
    WorkerLog.completedOnce(JobTypes.EmailSend, job.id);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    WorkerLog.failedOnce(JobTypes.EmailSend, job.id, message);
    await boss.fail(JobTypes.EmailSend, job.id, { message });
    throw err;
  }
  finally {
    await boss.stop({ close: true });
    if (typeof email.transporter.close === "function") {
      email.transporter.close();
    }
  }
}

main().catch((err) => {
  logger.error({ err }, "process-email-once failed");
  process.exit(1);
});
