import process from "node:process";

import { JobTypes } from "@/infrastructure/jobs/job-types";
import { makePgBoss } from "@/infrastructure/jobs/pgboss";
import { resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";
import { makeEmailTransporter } from "@/lib/email";
import logger from "@/lib/logger";

import { handleEmailJob } from "../email-worker";

async function main() {
  const boss = makePgBoss();
  boss.on("error", err => logger.error({ err }, "pg-boss error"));
  boss.on("warning", warning => logger.warn({ warning }, "pg-boss warning"));
  await boss.start();
  await boss.createQueue(
    JobTypes.EmailSend,
    resolveQueueOptions(JobTypes.EmailSend),
  );
  logger.info({ queue: JobTypes.EmailSend }, "Queue ensured");

  const email = makeEmailTransporter({ fromName: "MeBike" });
  await email.transporter.verify();
  logger.info("Email transporter verified");

  const jobs = await boss.fetch(JobTypes.EmailSend, { batchSize: 1 });
  const job = jobs[0];
  if (!job) {
    logger.info("No email jobs to process");
    await boss.stop({ close: true });
    if (typeof email.transporter.close === "function") {
      email.transporter.close();
    }
    return;
  }

  try {
    logger.info({ jobId: job.id }, "Processing email job once");
    await handleEmailJob(job, email);
    await boss.complete(JobTypes.EmailSend, job.id);
    logger.info({ jobId: job.id }, "Email job completed");
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Email job failed");
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
