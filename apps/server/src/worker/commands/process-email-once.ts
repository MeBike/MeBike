import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { makeJobBackend } from "@/infrastructure/jobs/backend";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";
import { makeEmailTransporter } from "@/lib/email";
import logger from "@/lib/logger";

import { handleEmailJob } from "../email-worker";
import { attachJobRuntimeLogging, WorkerLog } from "../worker-logging";

export type ProcessEmailOnceResult
  = | { readonly status: "empty" }
    | { readonly status: "processed"; readonly jobId: string };

export async function processEmailOnce(): Promise<ProcessEmailOnceResult> {
  const { runtime } = makeJobBackend();
  attachJobRuntimeLogging(runtime);
  await runtime.start();
  await runtime.ensureQueue(
    JobTypes.EmailSend,
    resolveQueueOptions(JobTypes.EmailSend),
  );
  WorkerLog.queueEnsured(JobTypes.EmailSend);

  const email = makeEmailTransporter({ fromName: "MeBike" });
  await email.transporter.verify();
  WorkerLog.emailVerified();

  const job = await runtime.fetchOne(JobTypes.EmailSend);
  if (!job) {
    WorkerLog.noJobs(JobTypes.EmailSend);
    await runtime.stop();
    if (typeof email.transporter.close === "function") {
      email.transporter.close();
    }
    return { status: "empty" };
  }

  try {
    WorkerLog.processingOnce(JobTypes.EmailSend, job.id);
    await handleEmailJob(job, email);
    await runtime.complete(JobTypes.EmailSend, job.id);
    WorkerLog.completedOnce(JobTypes.EmailSend, job.id);
    return { status: "processed", jobId: job.id };
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    WorkerLog.failedOnce(JobTypes.EmailSend, job.id, message);
    await runtime.fail(JobTypes.EmailSend, job.id, message);
    throw err;
  }
  finally {
    await runtime.stop();
    if (typeof email.transporter.close === "function") {
      email.transporter.close();
    }
  }
}

const isMain = fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");

if (isMain) {
  processEmailOnce().catch((err) => {
    logger.error({ err }, "process-email-once failed");
    process.exit(1);
  });
}
